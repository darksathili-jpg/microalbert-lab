"""Security and pedagogical contract for the offline, teacher-only assessment route."""
import pytest
from fastapi.testclient import TestClient
from app.main import (
    app, get_assessment_history, get_assessment_sessions, get_secure_registry,
    get_secure_limiter, get_tutor_adapter,
)
from app.assessment_history import AssessmentHistoryStore
from app.assessment_sessions import AssessmentSessionStore
from app.access_security import LocalTokenRegistry, FixedWindowRateLimiter, Principal

PATH = "/api/secure/assessment"
VALID = "def enfiler(file, valeur):\n    file.append(valeur)\ndef defiler(file):\n    return file.pop(0)"
BAD = "def enfiler(file, valeur):\n    pass\ndef defiler(file):\n    pass"

@pytest.fixture
def setup():
    registry = LocalTokenRegistry()
    limiter = FixedWindowRateLimiter(limit=4, window_seconds=60)
    app.dependency_overrides[get_secure_registry] = lambda: registry
    app.dependency_overrides[get_secure_limiter] = lambda: limiter
    sessions = AssessmentSessionStore()
    history = AssessmentHistoryStore()
    app.dependency_overrides[get_assessment_sessions] = lambda: sessions
    app.dependency_overrides[get_assessment_history] = lambda: history
    try:
        with TestClient(app) as client:
            yield client, registry
    finally:
        app.dependency_overrides.clear()

def auth(token):
    return {"Authorization": "Bearer " + token}

@pytest.fixture
def teacher_session(setup):
    client, registry = setup
    headers = auth(registry.issue(Principal("t1", "enseignant")))
    response = client.post(PATH + "/session", json={"mission_id": "file"}, headers=headers)
    assert response.status_code == 200
    return headers, response.json()["session_id"]


def submit(client, source=VALID, headers=None, mission_id="file", *, session_id="unused"):
    return client.post(PATH, json={
        "mission_id": mission_id, "source": source, "session_id": session_id,
    }, headers=headers or {})

def test_no_anonymous_or_student_access(setup):
    client, registry = setup
    assert submit(client).status_code == 401
    student = registry.issue(Principal("s1", "eleve"))
    assert submit(client, headers=auth(student)).status_code == 403
    auditor = registry.issue(Principal("a1", "audit"))
    assert submit(client, headers=auth(auditor)).status_code == 403

def test_static_only_no_claim_of_correctness(setup, teacher_session):
    client, _ = setup
    headers, session_id = teacher_session
    response = submit(client, headers=headers, session_id=session_id)
    assert response.status_code == 200
    data = response.json()
    assert data["syntax_valid"] is True
    assert data["findings"] == []
    assert data["functional_correctness"] == "not_evaluated"
    assert "Quels tests" in data["next_question"]
    assert "no_student_code_execution" in data["warnings"]

def test_socratic_hint_without_solution(setup, teacher_session):
    client, _ = setup
    headers, session_id = teacher_session
    response = submit(client, BAD, headers, session_id=session_id)
    assert response.status_code == 200
    data = response.json()
    assert data["findings"]
    assert data["next_question"].endswith("?")
    assert "file.pop" not in data["next_question"]
    assert "return file" not in data["next_question"]

def test_no_execution_even_for_malicious_source(setup, teacher_session, tmp_path):
    client, _ = setup
    headers, session_id = teacher_session
    marker = tmp_path / "should_not_exist"
    malicious = f"__import__('pathlib').Path({str(marker)!r}).write_text('bad')"
    response = submit(client, malicious, headers, session_id=session_id)
    assert response.status_code == 200
    assert not marker.exists()
    assert response.json()["functional_correctness"] == "not_evaluated"

def test_invalid_mission_and_payload(setup, teacher_session):
    client, _ = setup
    headers, session_id = teacher_session
    assert submit(client, headers=headers, mission_id="balises", session_id=session_id).status_code == 422
    assert submit(client, source="", headers=headers, session_id=session_id).status_code == 422
    assert submit(client, source="x"*8001, headers=headers, session_id=session_id).status_code == 422

def test_rate_limit(setup, teacher_session):
    client, _ = setup
    headers, session_id = teacher_session
    # Opening the session also consumes one of the four requests.
    for _ in range(3):
        assert submit(client, headers=headers, session_id=session_id).status_code == 200
    assert submit(client, headers=headers, session_id=session_id).status_code == 429

def test_no_provider_call(setup, teacher_session):
    client, _ = setup
    headers, session_id = teacher_session
    def forbidden_provider():
        raise AssertionError("Provider must never be used")
    app.dependency_overrides[get_tutor_adapter] = forbidden_provider
    assert submit(client, headers=headers, session_id=session_id).status_code == 200
