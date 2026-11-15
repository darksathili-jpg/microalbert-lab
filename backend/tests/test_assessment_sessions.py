"""Teacher-bound assessment session regression tests (no Albert calls)."""
import pytest
from fastapi.testclient import TestClient
from app.assessment_sessions import AssessmentSessionStore
from app.main import app, get_secure_registry, get_secure_limiter, get_assessment_sessions
from app.access_security import LocalTokenRegistry, FixedWindowRateLimiter, Principal


def test_session_is_opaque_bound_and_expires():
    clock = [0.0]
    store = AssessmentSessionStore(ttl_seconds=10, clock=lambda: clock[0])
    token = store.issue("teacher-a", "file")
    assert len(token) >= 32
    assert store.validate(token, "teacher-a", "file")
    assert not store.validate(token, "teacher-b", "file")
    assert not store.validate(token, "teacher-a", "balises")
    assert not store.validate("invalid", "teacher-a", "file")
    clock[0] = 10.0
    assert not store.validate(token, "teacher-a", "file")


def test_capacity_revoke_and_invalid_configuration():
    clock = [0.0]
    store = AssessmentSessionStore(max_sessions=1, clock=lambda: clock[0])
    first = store.issue("teacher", "file")
    clock[0] = 1.0
    second = store.issue("teacher", "file")
    assert not store.validate(first, "teacher", "file")
    assert not store.revoke(second, "other")
    assert store.revoke(second, "teacher")
    assert not store.validate(second, "teacher", "file")
    with pytest.raises(ValueError):
        AssessmentSessionStore(ttl_seconds=0)
    with pytest.raises(ValueError):
        AssessmentSessionStore(max_sessions=0)


def test_secure_session_endpoint_and_isolated_assessments():
    registry = LocalTokenRegistry()
    sessions = AssessmentSessionStore()
    app.dependency_overrides[get_secure_registry] = lambda: registry
    app.dependency_overrides[get_secure_limiter] = lambda: FixedWindowRateLimiter(limit=100)
    app.dependency_overrides[get_assessment_sessions] = lambda: sessions
    try:
        with TestClient(app) as client:
            a = registry.issue(Principal("teacher-a", "enseignant"))
            b = registry.issue(Principal("teacher-b", "enseignant"))
            student = registry.issue(Principal("student", "eleve"))
            url = "/api/secure/assessment/session"
            assert client.post(url, json={"mission_id": "file"}).status_code == 401
            assert client.post(url, headers={"Authorization": "Bearer " + student},
                               json={"mission_id": "file"}).status_code == 403
            headers_a = {"Authorization": "Bearer " + a}
            headers_b = {"Authorization": "Bearer " + b}
            first = client.post(url, headers=headers_a, json={"mission_id": "file"})
            second = client.post(url, headers=headers_a, json={"mission_id": "file"})
            assert first.status_code == second.status_code == 200
            one = first.json()["session_id"]
            two = second.json()["session_id"]
            assert one != two
            payload = {"mission_id": "file", "source": "def enfiler(f,v):\n pass\ndef defiler(f):\n pass"}
            def assess(headers, session):
                return client.post("/api/secure/assessment", headers=headers,
                                   json={**payload, "session_id": session})
            assert assess(headers_a, one).json()["trend"]["attempts_observed"] == 1
            assert assess(headers_a, one).json()["trend"]["attempts_observed"] == 2
            assert assess(headers_a, two).json()["trend"]["attempts_observed"] == 1
            assert assess(headers_b, one).status_code == 403
            assert assess(headers_a, "forged").status_code == 403
    finally:
        app.dependency_overrides.clear()
