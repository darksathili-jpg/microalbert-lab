"""Exercises through the Albert adapter with an in-process HTTP transport."""
import json

import httpx
import pytest
from fastapi.testclient import TestClient

from app.access_security import FixedWindowRateLimiter, LocalTokenRegistry, Principal
from app.albert_adapter import AlbertAdapter, OFFICIAL_HOST, ProviderConfig
from app.assessment_sessions import AssessmentSessionStore
from app.local_teacher_pilot import SIMULATION_MODEL, simulate_reply
from app import local_teacher_pilot
from app.main import (
    app, get_assessment_sessions, get_secure_limiter, get_secure_registry,
    get_tutor_adapter, get_tutor_progress,
)
from app.training_catalog import TRAINING_MISSIONS
from app.tutor_progress import TutorProgressStore

PATH = "/api/secure/tutor"


@pytest.fixture
def teacher_pilot(monkeypatch):
    requests = []
    pending_replies = []

    def respond(request):
        requests.append(json.loads(request.content)["messages"])
        if pending_replies:
            return pending_replies.pop(0)
        return simulate_reply(request)

    registry = LocalTokenRegistry()
    sessions = AssessmentSessionStore()
    progress = TutorProgressStore()
    limiter = FixedWindowRateLimiter(limit=20)
    adapter = AlbertAdapter(
        ProviderConfig(f"https://{OFFICIAL_HOST}", frozenset({SIMULATION_MODEL})),
        token="test-only", transport=httpx.MockTransport(respond),
    )
    monkeypatch.setattr(app, "dependency_overrides", {
        get_secure_registry: lambda: registry,
        get_secure_limiter: lambda: limiter,
        get_assessment_sessions: lambda: sessions,
        get_tutor_progress: lambda: progress,
        get_tutor_adapter: lambda: adapter,
    })
    with TestClient(app) as client:
        yield client, registry, requests, pending_replies


def headers(registry, identity="teacher", role="enseignant"):
    return {"Authorization": "Bearer " + registry.issue(Principal(identity, role))}


def open_session(client, auth, mission_id):
    opened = client.post("/api/secure/assessment/session", headers=auth, json={"mission_id": mission_id})
    assert opened.status_code == 200
    return opened.json()["session_id"]


@pytest.mark.parametrize("mission_id", TRAINING_MISSIONS)
def test_two_tutor_turns_use_diagnostics_and_own_session(teacher_pilot, mission_id):
    client, registry, requests, _ = teacher_pilot
    auth = headers(registry)
    assert client.get(PATH + "/models", headers=auth).json() == {"models": [SIMULATION_MODEL]}
    assert requests == []
    session = open_session(client, auth, mission_id)
    another = open_session(client, auth, mission_id)
    mission = TRAINING_MISSIONS[mission_id]
    payload = dict(model_id=SIMULATION_MODEL, mission_id=mission_id, session_id=session,
                   phase="implementation", message="Quel test choisir ?", source=mission.starter_code)
    first = client.post(PATH, headers=auth, json=payload)
    assert first.status_code == 200
    question = first.json()["reply"]
    assert question.endswith("?")
    prompt = requests[0][1]["content"]
    assert mission.statement in prompt and mission.level in prompt
    assert "empty_body" in prompt and "Quel test choisir ?" in prompt
    assert session not in prompt
    described_test = {
        "expression": "appel(entrée)", "expected": "prévision",
        "observed": "observation", "justification": "Pour distinguer deux comportements.",
    }
    payload.update(phase="verification", message="J’ai modifié mon programme.",
                   source=mission.starter_code.replace("pass", "return None"), test_case=described_test)
    second = client.post(PATH, headers=auth, json=payload)
    assert second.status_code == 200
    assert second.json()["reply"] != question
    assert question in requests[1][1]["content"]
    assert "empty_body" not in requests[1][1]["content"]
    line = next(line for line in requests[1][1]["content"].splitlines() if line.startswith("Cas de test déclaré : "))
    assert json.loads(line.split(" : ", 1)[1]) == {
        "appel": "appel(entrée)", "attendu": "prévision", "observé": "observation",
        "justification": "Pour distinguer deux comportements.",
    }
    assert "déclarée par l’élève" in requests[1][0]["content"]
    assert "Ne conclus pas" in requests[1][0]["content"]
    payload.pop("test_case")
    payload["session_id"] = another
    assert client.post(PATH, headers=auth, json=payload).json()["reply"] == question
    assert question not in requests[2][1]["content"]


def test_checks_access_before_provider_and_recovers_after_error(teacher_pilot):
    client, registry, requests, replies = teacher_pilot
    auth = headers(registry)
    other = headers(registry, "other")
    student = headers(registry, "student", "eleve")
    assert client.get(PATH + "/models").status_code == 401
    assert client.get(PATH + "/models", headers=student).status_code == 403
    mission_id, wrong_mission = tuple(TRAINING_MISSIONS)
    session = open_session(client, auth, mission_id)
    payload = dict(model_id=SIMULATION_MODEL, mission_id=mission_id, session_id=session,
                   phase="implementation", message="Donne la solution")
    assert client.post(PATH, json=payload).status_code == 401
    assert client.post(PATH, headers=student, json=payload).status_code == 403
    assert client.post(PATH, headers=other, json=payload).status_code == 403
    assert client.post(PATH, headers=auth, json={**payload, "mission_id": wrong_mission}).status_code == 403
    assert client.post(PATH, headers=auth, json={**payload, "session_id": None}).status_code == 403
    assert not requests

    replies.append(httpx.Response(503))
    assert client.post(PATH, headers=auth, json=payload).status_code == 503
    for content, reason in [("La réponse est prête.", "missing_question"), ("Voici le code complet :", "direct_solution")]:
        replies.append(httpx.Response(200, json={"choices": [{"message": {"content": content}}]}))
        result = client.post(PATH, headers=auth, json=payload)
        assert result.status_code == 200
        data = result.json()
        assert content not in data["reply"]
        assert "output_guard_" + reason in data["warnings"]
    assert "Relance précédente : aucune" in requests[1][1]["content"]
    revoked = client.post("/api/secure/assessment/session/revoke", headers=auth, json={"session_id": session})
    assert revoked.status_code == 200
    assert client.post(PATH, headers=auth, json=payload).status_code == 403
    assert len(requests) == 3


def test_training_test_fields_are_bounded_and_validated(teacher_pilot):
    client, registry, requests, _ = teacher_pilot
    auth = headers(registry)
    mission_id = "terminale-parcours-graphe"
    session = open_session(client, auth, mission_id)
    case = {field: '"' * size for field, size in (
        ("expression", 200), ("expected", 160), ("observed", 160), ("justification", 240),
    )}
    payload = dict(model_id=SIMULATION_MODEL, mission_id=mission_id, session_id=session,
                   phase="verification", message="é" * 2000, source=" " * 7999 + "x", test_case=case)
    assert client.post(PATH, headers=auth, json={**payload, "session_id": "invalid"}).status_code == 403
    assert client.post(PATH, headers=auth, json={**payload, "mission_id": "file"}).status_code == 422
    for invalid in [{"observed": "  "}, {"expected": "é" * 161}, {"extra": "unexpected"}]:
        result = client.post(PATH, headers=auth, json={**payload, "test_case": {**case, **invalid}})
        assert result.status_code == 422
    assert not requests
    result = client.post(PATH, headers=auth, json=payload)
    assert result.status_code == 200
    prompt = requests[0][1]["content"]
    assert len(prompt) <= 4000
    line = next(line for line in prompt.splitlines() if line.startswith("Cas de test déclaré : "))
    assert json.loads(line.split(" : ", 1)[1])["justification"] == case["justification"]


@pytest.mark.parametrize("args, calls_provider", [
    ([], False), (["--simulate-tutor"], False), (["--albert"], True),
])
def test_launcher_requires_explicit_opt_in(monkeypatch, capsys, args, calls_provider):
    import sys

    adapter = object()
    configured = []
    launches = []
    overrides = {}
    monkeypatch.setattr(sys, "argv", ["pilot", *args])
    monkeypatch.setattr(app, "dependency_overrides", overrides)
    monkeypatch.setattr(local_teacher_pilot, "get_secure_registry", lambda: LocalTokenRegistry())
    monkeypatch.setattr(local_teacher_pilot, "get_tutor_adapter", lambda: configured.append(True) or adapter)
    monkeypatch.setattr(local_teacher_pilot.uvicorn, "run", lambda *a, **kw: launches.append(kw))
    local_teacher_pilot.main()
    assert bool(configured) == calls_provider
    assert launches == [{"host": "127.0.0.1", "port": 8000, "workers": 1}]
    selected = overrides[local_teacher_pilot.get_tutor_adapter]()
    if args == ["--simulate-tutor"]:
        assert selected.config.allowed_models == {SIMULATION_MODEL}
    else:
        assert selected is (adapter if calls_provider else None)
    assert "Jeton temporaire" in capsys.readouterr().out


def test_launcher_refuses_unapproved_albert(monkeypatch, capsys):
    import sys

    monkeypatch.setattr(sys, "argv", ["pilot", "--albert"])
    monkeypatch.delenv("MICROALBERT_REAL_ACCESS_APPROVED", raising=False)
    with pytest.raises(SystemExit) as error:
        local_teacher_pilot.main()
    assert error.value.code == 2
    captured = capsys.readouterr()
    assert captured.out == ""
    assert "non approuvée" in captured.err
