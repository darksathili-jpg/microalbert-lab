"""G3-P4C: concurrent abuse and legacy bypass tests, no network."""
from concurrent.futures import ThreadPoolExecutor

from fastapi.testclient import TestClient
from app.access_security import FixedWindowRateLimiter, LocalTokenRegistry, Principal
from app.main import app, get_secure_registry, get_secure_limiter, get_albert_adapter


def test_concurrent_requests_share_one_local_subject_quota():
    limiter = FixedWindowRateLimiter(limit=5, window_seconds=60)
    with ThreadPoolExecutor(max_workers=24) as pool:
        results = list(pool.map(lambda _: limiter.allow("same-subject"), range(100)))
    assert sum(results) == 5


def test_independent_subjects_do_not_share_quota():
    limiter = FixedWindowRateLimiter(limit=1, window_seconds=60)
    with ThreadPoolExecutor(max_workers=10) as pool:
        results = list(pool.map(lambda i: limiter.allow(f"subject-{i}"), range(10)))
    assert all(results)


def test_legacy_route_rejects_provider_even_when_overridden():
    class ForbiddenAdapter:
        async def chat(self, *args, **kwargs):
            raise AssertionError("Legacy route reached provider")
    app.dependency_overrides[get_albert_adapter] = lambda: ForbiddenAdapter()
    try:
        with TestClient(app) as client:
            response = client.post("/api/chat", json={
                "mode": "enseignant", "model_id": "some-real-model",
                "message": "Question fictive"
            })
            assert response.status_code == 400
            assert response.json()["detail"]["code"] == "invalid_input"
    finally:
        app.dependency_overrides.pop(get_albert_adapter, None)


def test_protected_route_rejects_teacher_escalation_before_quota():
    registry = LocalTokenRegistry()
    limiter = FixedWindowRateLimiter(limit=1, window_seconds=60)
    token = registry.issue(Principal("learner", "eleve"))
    app.dependency_overrides[get_secure_registry] = lambda: registry
    app.dependency_overrides[get_secure_limiter] = lambda: limiter
    try:
        with TestClient(app) as client:
            headers = {"Authorization": "Bearer " + token}
            denied = client.post("/api/secure/chat", headers=headers, json={
                "mode": "enseignant", "model_id": "microalbert-mock",
                "message": "Question fictive"
            })
            assert denied.status_code == 403
            accepted = client.post("/api/secure/chat", headers=headers, json={
                "mode": "eleve", "model_id": "microalbert-mock",
                "message": "Question fictive"
            })
            assert accepted.status_code == 200
    finally:
        app.dependency_overrides.pop(get_secure_registry, None)
        app.dependency_overrides.pop(get_secure_limiter, None)
