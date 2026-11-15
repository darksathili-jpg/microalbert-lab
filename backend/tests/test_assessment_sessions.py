"""Teacher-bound assessment session regression tests (no Albert calls)."""
import pytest
from fastapi.testclient import TestClient
from app.assessment_sessions import AssessmentSessionStore
from app.main import app, get_secure_registry, get_secure_limiter, get_assessment_sessions, get_assessment_history
from app.assessment_history import AssessmentHistoryStore
from app.access_security import LocalTokenRegistry, FixedWindowRateLimiter, Principal


def test_session_is_opaque_bound_and_expires():
    clock = [0.0]
    store = AssessmentSessionStore(ttl_seconds=10, clock=lambda: clock[0])
    token = store.issue("enseignant-é", "file")
    assert len(token) >= 32
    assert store.validate(token, "enseignant-é", "file")
    assert not store.validate(token, "teacher-b", "file")
    assert not store.validate(token, "enseignant-é", "balises")
    assert not store.validate("invalid", "teacher-a", "file")
    assert not store.validate("invalide-é", "teacher-a", "file")
    clock[0] = 10.0
    assert not store.validate(token, "enseignant-é", "file")


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
            assert assess(headers_a, "forgé").status_code == 403
    finally:
        app.dependency_overrides.clear()


def test_invalid_capability_rejected_before_static_analysis(monkeypatch):
    """A forged session cannot make the backend inspect submitted source."""
    registry = LocalTokenRegistry()
    sessions = AssessmentSessionStore()
    history = AssessmentHistoryStore()
    app.dependency_overrides[get_secure_registry] = lambda: registry
    app.dependency_overrides[get_secure_limiter] = lambda: FixedWindowRateLimiter(limit=100)
    app.dependency_overrides[get_assessment_sessions] = lambda: sessions
    app.dependency_overrides[get_assessment_history] = lambda: history
    try:
        import app.main as main
        def forbidden_analysis(source):
            raise AssertionError("source parsed before session validation")
        monkeypatch.setattr(main, "assess_queue_submission", forbidden_analysis)
        with TestClient(app) as client:
            teacher = registry.issue(Principal("teacher-a", "enseignant"))
            headers = {"Authorization": "Bearer " + teacher}
            response = client.post("/api/secure/assessment", headers=headers, json={
                "mission_id": "file", "session_id": "forged",
                "source": "def dangerous():\\n    pass"
            })
            assert response.status_code == 403
            assert response.json()["detail"]["code"] == "invalid_assessment_session"
            assert not history._entries
    finally:
        app.dependency_overrides.clear()


def test_revoke_endpoint_enforces_owner_and_invalidates_session():
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
            ha = {"Authorization": "Bearer " + a}
            hb = {"Authorization": "Bearer " + b}
            hs = {"Authorization": "Bearer " + student}
            issue = client.post("/api/secure/assessment/session", headers=ha,
                                json={"mission_id": "file"})
            assert issue.status_code == 200
            token = issue.json()["session_id"]
            url = "/api/secure/assessment/session/revoke"
            payload = {"session_id": token}
            assert client.post(url, json=payload).status_code == 401
            assert client.post(url, headers=hs, json=payload).status_code == 403
            assert client.post(url, headers=hb, json=payload).status_code == 200
            assert sessions.validate(token, "teacher-a", "file")
            assert client.post(url, headers=ha, json=payload).status_code == 200
            assert not sessions.validate(token, "teacher-a", "file")
            assert client.post(url, headers=ha, json=payload).status_code == 200
            response = client.post("/api/secure/assessment", headers=ha, json={
                "mission_id": "file", "session_id": token,
                "source": "def enfiler(f,v):\\n pass"
            })
            assert response.status_code == 403
    finally:
        app.dependency_overrides.clear()


def test_missing_session_is_rejected_and_cannot_touch_analyzer(monkeypatch):
    """Legacy requests must not enter analysis or create shared history."""
    registry = LocalTokenRegistry()
    history = AssessmentHistoryStore()
    app.dependency_overrides[get_secure_registry] = lambda: registry
    app.dependency_overrides[get_secure_limiter] = lambda: FixedWindowRateLimiter(limit=100)
    app.dependency_overrides[get_assessment_history] = lambda: history
    try:
        import app.main as main
        monkeypatch.setattr(main, "assess_queue_submission",
                            lambda source: (_ for _ in ()).throw(
                                AssertionError("unauthorized source inspected")))
        with TestClient(app) as client:
            token = registry.issue(Principal("teacher-a", "enseignant"))
            response = client.post("/api/secure/assessment",
                headers={"Authorization": "Bearer " + token},
                json={"mission_id": "file", "source": "def enfiler(f,v): pass"})
            assert response.status_code == 422
            assert not history._entries
    finally:
        app.dependency_overrides.clear()


def test_session_isolation_same_teacher_no_legacy_warning():
    registry = LocalTokenRegistry()
    sessions = AssessmentSessionStore()
    history = AssessmentHistoryStore()
    app.dependency_overrides[get_secure_registry] = lambda: registry
    app.dependency_overrides[get_secure_limiter] = lambda: FixedWindowRateLimiter(limit=100)
    app.dependency_overrides[get_assessment_sessions] = lambda: sessions
    app.dependency_overrides[get_assessment_history] = lambda: history
    try:
        with TestClient(app) as client:
            token = registry.issue(Principal("teacher-a", "enseignant"))
            headers = {"Authorization": "Bearer " + token}
            one = sessions.issue("teacher-a", "file")
            two = sessions.issue("teacher-a", "file")
            for session_id, expected in ((one, 1), (one, 2), (two, 1)):
                response = client.post("/api/secure/assessment", headers=headers, json={
                    "mission_id": "file", "session_id": session_id,
                    "source": "def enfiler(f, v):\n    pass\ndef defiler(f):\n    pass"
                })
                assert response.status_code == 200
                assert response.json()["trend"]["attempts_observed"] == expected
                assert "legacy_shared_teacher_history" not in response.json()["warnings"]
    finally:
        app.dependency_overrides.clear()
