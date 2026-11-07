"""G3-P4B protected HTTP mock route — offline tests only."""
import pytest
from fastapi.testclient import TestClient

from app.access_security import FixedWindowRateLimiter, LocalTokenRegistry, Principal
from app.main import app, get_secure_registry, get_secure_limiter


@pytest.fixture
def environment():
    registry = LocalTokenRegistry()
    clock = [100.0]
    limiter = FixedWindowRateLimiter(limit=2, window_seconds=60, clock=lambda: clock[0])
    app.dependency_overrides[get_secure_registry] = lambda: registry
    app.dependency_overrides[get_secure_limiter] = lambda: limiter
    try:
        with TestClient(app) as client:
            yield client, registry, clock
    finally:
        app.dependency_overrides.pop(get_secure_registry, None)
        app.dependency_overrides.pop(get_secure_limiter, None)


def body(mode="eleve", model="microalbert-mock"):
    return {"mode": mode, "model_id": model, "message": "QUESTION_FICTIVE_SENSIBLE"}


def auth(token):
    return {"Authorization": "Bearer " + token}


def test_no_credentials_refused_401(environment):
    client, _, _ = environment
    response = client.post("/api/secure/chat", json=body())
    assert response.status_code == 401
    assert response.json()["detail"]["code"] == "authentication_required"


def test_forged_token_refused_401(environment):
    client, _, _ = environment
    response = client.post("/api/secure/chat", json=body(), headers=auth("FORGED"))
    assert response.status_code == 401


def test_student_cannot_impersonate_teacher_403(environment):
    client, registry, _ = environment
    token = registry.issue(Principal("student-1", "eleve"))
    response = client.post("/api/secure/chat", json=body(mode="enseignant"), headers=auth(token))
    assert response.status_code == 403
    assert response.json()["detail"]["code"] == "mode_not_authorized"


def test_teacher_cannot_impersonate_auditor_403(environment):
    client, registry, _ = environment
    token = registry.issue(Principal("teacher-1", "enseignant"))
    response = client.post("/api/secure/chat", json=body(mode="audit"), headers=auth(token))
    assert response.status_code == 403


@pytest.mark.parametrize("role", ["eleve", "enseignant", "audit"])
def test_authenticated_roles_can_use_mock(environment, role):
    client, registry, _ = environment
    token = registry.issue(Principal(role + "-1", role))
    response = client.post("/api/secure/chat", json=body(mode=role), headers=auth(token))
    assert response.status_code == 200
    assert "authenticated_local_demo" in response.json()["warnings"]
    assert "QUESTION_FICTIVE_SENSIBLE" not in response.text


def test_rate_limit_429_and_reset(environment):
    client, registry, clock = environment
    token = registry.issue(Principal("student-1", "eleve"))
    for _ in range(2):
        assert client.post("/api/secure/chat", json=body(), headers=auth(token)).status_code == 200
    response = client.post("/api/secure/chat", json=body(), headers=auth(token))
    assert response.status_code == 429
    assert response.json()["detail"]["code"] == "rate_limited"
    clock[0] += 61
    assert client.post("/api/secure/chat", json=body(), headers=auth(token)).status_code == 200


def test_unknown_model_never_forwarded(environment):
    client, registry, _ = environment
    token = registry.issue(Principal("student-1", "eleve"))
    response = client.post("/api/secure/chat", json=body(model="some-real-model"), headers=auth(token))
    assert response.status_code == 400


def test_revoked_token_refused(environment):
    client, registry, _ = environment
    token = registry.issue(Principal("student-1", "eleve"))
    registry.revoke(token)
    assert client.post("/api/secure/chat", json=body(), headers=auth(token)).status_code == 401


def test_legacy_mock_route_still_available(environment):
    client, _, _ = environment
    response = client.post("/api/chat", json=body())
    assert response.status_code == 200
    assert "mock_provider" in response.json()["warnings"]
