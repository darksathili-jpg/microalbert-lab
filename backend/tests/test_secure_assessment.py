"""Security and pedagogical contract for the offline, teacher-only assessment route."""
import pytest
from fastapi.testclient import TestClient
from app.main import app, get_secure_registry, get_secure_limiter, get_tutor_adapter
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
    try:
        with TestClient(app) as client:
            yield client, registry
    finally:
        app.dependency_overrides.clear()

def auth(token):
    return {"Authorization": "Bearer " + token}

def submit(client, source=VALID, headers=None, mission_id="file"):
    return client.post(PATH, json={"mission_id": mission_id, "source": source}, headers=headers or {})

def test_no_anonymous_or_student_access(setup):
    client, registry = setup
    assert submit(client).status_code == 401
    student = registry.issue(Principal("s1", "eleve"))
    assert submit(client, headers=auth(student)).status_code == 403
    auditor = registry.issue(Principal("a1", "audit"))
    assert submit(client, headers=auth(auditor)).status_code == 403

def test_static_only_no_claim_of_correctness(setup):
    client, registry = setup
    teacher = registry.issue(Principal("t1", "enseignant"))
    response = submit(client, headers=auth(teacher))
    assert response.status_code == 200
    data = response.json()
    assert data["syntax_valid"] is True
    assert data["findings"] == []
    assert data["functional_correctness"] == "not_evaluated"
    assert "Quels tests" in data["next_question"]
    assert "no_student_code_execution" in data["warnings"]

def test_socratic_hint_without_solution(setup):
    client, registry = setup
    teacher = registry.issue(Principal("t1", "enseignant"))
    response = submit(client, BAD, auth(teacher))
    assert response.status_code == 200
    data = response.json()
    assert data["findings"]
    assert data["next_question"].endswith("?")
    assert "file.pop" not in data["next_question"]
    assert "return file" not in data["next_question"]

def test_no_execution_even_for_malicious_source(setup, tmp_path):
    client, registry = setup
    teacher = registry.issue(Principal("t1", "enseignant"))
    marker = tmp_path / "should_not_exist"
    malicious = f"__import__('pathlib').Path({str(marker)!r}).write_text('bad')"
    response = submit(client, malicious, auth(teacher))
    assert response.status_code == 200
    assert not marker.exists()
    assert response.json()["functional_correctness"] == "not_evaluated"

def test_invalid_mission_and_payload(setup):
    client, registry = setup
    teacher = registry.issue(Principal("t1", "enseignant"))
    assert submit(client, headers=auth(teacher), mission_id="balises").status_code == 422
    assert submit(client, source="", headers=auth(teacher)).status_code == 422
    assert submit(client, source="x"*8001, headers=auth(teacher)).status_code == 422

def test_rate_limit(setup):
    client, registry = setup
    teacher = registry.issue(Principal("t1", "enseignant"))
    for _ in range(4):
        assert submit(client, headers=auth(teacher)).status_code == 200
    assert submit(client, headers=auth(teacher)).status_code == 429

def test_no_provider_call(setup):
    client, registry = setup
    teacher = registry.issue(Principal("t1", "enseignant"))
    def forbidden_provider():
        raise AssertionError("Provider must never be used")
    app.dependency_overrides[get_tutor_adapter] = forbidden_provider
    assert submit(client, headers=auth(teacher)).status_code == 200
