"""Teacher-facing training activities and their two-level assessment contract."""
import ast

import pytest
from fastapi.testclient import TestClient

from app.access_security import FixedWindowRateLimiter, LocalTokenRegistry, Principal
from app.assessment_history import AssessmentHistoryStore
from app.assessment_sessions import AssessmentSessionStore
from app.main import (
    app, get_assessment_history, get_assessment_sessions, get_secure_limiter,
    get_secure_registry, get_tutor_adapter,
)
from app.training_catalog import TRAINING_MISSIONS


ASSESSMENT = "/api/secure/assessment"
CASES = [
    ("premiere-somme-filtree", "Première", "G1SNSIN03316", "liste est vide"),
    ("terminale-parcours-graphe", "Terminale", "26-NSIJ1ME1", "sommet dans le dictionnaire"),
]


@pytest.fixture
def pilot(monkeypatch):
    registry = LocalTokenRegistry()
    limiter = FixedWindowRateLimiter(limit=20)
    sessions = AssessmentSessionStore()
    history = AssessmentHistoryStore()

    def unexpected_provider():
        pytest.fail("Le parcours hors ligne ne doit pas appeler Albert")

    monkeypatch.setattr(app, "dependency_overrides", {
        get_secure_registry: lambda: registry,
        get_secure_limiter: lambda: limiter,
        get_assessment_sessions: lambda: sessions,
        get_assessment_history: lambda: history,
        get_tutor_adapter: unexpected_provider,
    })
    with TestClient(app) as client:
        yield client, registry


def bearer(registry, role):
    return {"Authorization": f"Bearer {registry.issue(Principal(role, role))}"}


def activity_session(client, headers, mission_id):
    response = client.post(ASSESSMENT + "/session", headers=headers, json={"mission_id": mission_id})
    assert response.status_code == 200
    return response.json()["session_id"]


def test_catalog_is_teacher_only_and_delivers_no_solution(pilot):
    client, registry = pilot
    url = ASSESSMENT + "/activities"
    assert client.get(url).status_code == 401
    for role in ("eleve", "audit"):
        assert client.get(url, headers=bearer(registry, role)).status_code == 403
    response = client.get(url, headers=bearer(registry, "enseignant"))
    assert response.status_code == 200
    assert len(response.json()) == len(CASES)
    for activity, (mission_id, level, reference, _) in zip(response.json(), CASES, strict=True):
        assert set(activity) == {
            "mission_id", "title", "level", "source_reference", "source_url", "statement",
            "starter_code", "checks_to_design",
        }
        assert activity["mission_id"] == mission_id
        assert activity["level"] == level
        assert reference in activity["source_reference"]
        assert activity["source_url"].startswith("https://")
        [definition] = ast.parse(activity["starter_code"]).body
        assert definition.name == TRAINING_MISSIONS[mission_id].function.name
        assert len(definition.args.args) == TRAINING_MISSIONS[mission_id].function.arity
        assert len(definition.body) == 1 and isinstance(definition.body[0], ast.Pass)
        assert len(activity["checks_to_design"]) >= 3


@pytest.mark.parametrize("mission_id,level,reference,concept", CASES)
def test_multi_turn_assessment_uses_mission_and_never_certifies_code(
    pilot, mission_id, level, reference, concept
):
    client, registry = pilot
    headers = bearer(registry, "enseignant")
    mission = TRAINING_MISSIONS[mission_id]
    session_id = activity_session(client, headers, mission_id)

    def submit(source, phase, session=session_id):
        response = client.post(ASSESSMENT, headers=headers, json={
            "mission_id": mission_id,
            "source": source,
            "session_id": session,
            "phase": phase,
        })
        assert response.status_code == 200
        data = response.json()
        assert data["functional_correctness"] == "not_evaluated"
        assert data["next_question"].endswith("?")
        return data

    discovery = submit(mission.starter_code, "decouverte")
    assert concept in discovery["next_question"]
    implementation = submit(mission.starter_code, "implementation")
    assert mission.function.name in implementation["next_question"]
    assert "file" not in implementation["next_question"]
    # This program satisfies the structural checks while violating both contracts.
    wrong_program = mission.starter_code.replace("pass", "return None")
    verification = submit(wrong_program, "verification")
    assert verification["findings"] == []
    assert verification["trend"]["resolved_findings"] == ["empty_body", "missing_return"]
    assert verification["trend"]["attempts_observed"] == 3
    assert "cas limites" in verification["next_question"]
    another = activity_session(client, headers, mission_id)
    assert submit(mission.starter_code, "decouverte", another)["trend"]["attempts_observed"] == 1


def test_session_for_one_mission_cannot_submit_to_the_other(pilot):
    client, registry = pilot
    headers = bearer(registry, "enseignant")
    first, second = TRAINING_MISSIONS
    session_id = activity_session(client, headers, first)
    payload = {"mission_id": second, "session_id": session_id, "source": "def f(: pass"}
    assert client.post(ASSESSMENT, headers=headers, json=payload).status_code == 403
    assert client.post(ASSESSMENT, headers=bearer(registry, "eleve"), json=payload).status_code == 403
