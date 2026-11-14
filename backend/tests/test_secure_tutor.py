"""No live credentials or network: authorization and simulated Albert tutor tests."""
import httpx
from fastapi.testclient import TestClient
from app.main import app, get_secure_registry, get_secure_limiter, get_tutor_adapter
from app.access_security import LocalTokenRegistry, FixedWindowRateLimiter, Principal
from app.albert_adapter import AlbertAdapter, ProviderConfig

MODEL = "test-chat"
def body():
    return dict(model_id=MODEL, mission_id="file", phase="recherche",
                message="Comment raisonner sur une file ?", attempts=1,
                hints_used=0, has_student_work=True)

def test_tutor_denies_anonymous_and_student_and_defaults_closed():
    registry = LocalTokenRegistry()
    limiter = FixedWindowRateLimiter(limit=20, window_seconds=60)
    app.dependency_overrides[get_secure_registry] = lambda: registry
    app.dependency_overrides[get_secure_limiter] = lambda: limiter
    try:
        with TestClient(app) as client:
            assert client.post("/api/secure/tutor", json=body()).status_code == 401
            student = registry.issue(Principal("student", "eleve"))
            assert client.post("/api/secure/tutor", json=body(), headers={"Authorization":"Bearer "+student}).status_code == 403
            teacher = registry.issue(Principal("teacher", "enseignant"))
            response = client.post("/api/secure/tutor", json=body(), headers={"Authorization":"Bearer "+teacher})
            assert response.status_code == 503
            assert response.json()["detail"]["code"] == "provider_not_configured"
    finally:
        app.dependency_overrides.clear()

def test_teacher_tutor_with_injected_mock_transport():
    seen = []
    def handler(request):
        seen.append(request)
        assert request.url.host == "albert.api.etalab.gouv.fr"
        assert "tuteur" in request.content.decode().lower()
        return httpx.Response(200, json={"choices":[{"message":{"content":"Quelle valeur quitte la file en premier ?"},"finish_reason":"stop"}]})
    adapter = AlbertAdapter(ProviderConfig("https://albert.api.etalab.gouv.fr", frozenset({MODEL})),
                            token="FAKE_TEST_TOKEN", transport=httpx.MockTransport(handler))
    registry = LocalTokenRegistry()
    teacher = registry.issue(Principal("teacher", "enseignant"))
    app.dependency_overrides[get_secure_registry] = lambda: registry
    app.dependency_overrides[get_secure_limiter] = lambda: FixedWindowRateLimiter(limit=20, window_seconds=60)
    app.dependency_overrides[get_tutor_adapter] = lambda: adapter
    try:
        with TestClient(app) as client:
            response = client.post("/api/secure/tutor", json=body(), headers={"Authorization":"Bearer "+teacher})
            assert response.status_code == 200
            assert response.json()["reply"].startswith("Quelle valeur")
            assert "model_output_unverified" in response.json()["warnings"]
            assert len(seen) == 1
    finally:
        app.dependency_overrides.clear()

def test_real_provider_requires_explicit_server_approval(monkeypatch):
    monkeypatch.setenv("MICROALBERT_PROVIDER", "albert")
    monkeypatch.setenv("ALBERT_API_KEY", "TEST_ONLY_NOT_REAL")
    monkeypatch.setenv("ALBERT_ALLOWED_MODELS", MODEL)
    monkeypatch.delenv("MICROALBERT_REAL_ACCESS_APPROVED", raising=False)
    from app.main import get_tutor_adapter
    assert get_tutor_adapter() is None
    monkeypatch.setenv("MICROALBERT_REAL_ACCESS_APPROVED", "yes")
    instance = get_tutor_adapter()
    assert isinstance(instance, AlbertAdapter)
    assert MODEL in instance.config.allowed_models

def test_real_provider_rejects_invalid_origin(monkeypatch):
    monkeypatch.setenv("MICROALBERT_PROVIDER", "albert")
    monkeypatch.setenv("MICROALBERT_REAL_ACCESS_APPROVED", "yes")
    monkeypatch.setenv("ALBERT_API_KEY", "TEST_ONLY_NOT_REAL")
    monkeypatch.setenv("ALBERT_ALLOWED_MODELS", MODEL)
    monkeypatch.setenv("ALBERT_API_BASE_URL", "https://attacker.example")
    from app.main import get_tutor_adapter
    assert get_tutor_adapter() is None

def test_tutor_rejects_unregistered_mission():
    registry = LocalTokenRegistry()
    teacher = registry.issue(Principal("teacher", "enseignant"))
    app.dependency_overrides[get_secure_registry] = lambda: registry
    app.dependency_overrides[get_secure_limiter] = lambda: FixedWindowRateLimiter(limit=20, window_seconds=60)
    try:
        with TestClient(app) as client:
            request = body()
            request["mission_id"] = "arbitrary_student_prompt"
            response = client.post("/api/secure/tutor", json=request,
                                   headers={"Authorization": "Bearer " + teacher})
            assert response.status_code == 422
    finally:
        app.dependency_overrides.clear()
