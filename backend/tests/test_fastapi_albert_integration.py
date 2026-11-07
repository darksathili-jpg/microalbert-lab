"""G3-P2A: FastAPI integration with exclusively simulated Albert HTTP."""
import httpx
import pytest
from fastapi.testclient import TestClient

from app.albert_adapter import AlbertAdapter, ProviderConfig
from app.main import app, get_albert_adapter

MODEL = "test-chat"
SECRET = "TEST_ONLY_FAKE_TOKEN"
MARKER = "SENSITIVE_TEST_INPUT_NOT_TO_ECHO"


def make_adapter(handler):
    return AlbertAdapter(
        ProviderConfig("https://albert.api.etalab.gouv.fr", frozenset({MODEL})),
        token=SECRET,
        transport=httpx.MockTransport(handler),
    )


@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def payload(model=MODEL, mode="eleve", message="Question fictive"):
    return {"mode": mode, "model_id": model, "message": message}


def test_default_mock_is_unchanged(client):
    response = client.post("/api/chat", json=payload(model="microalbert-mock"))
    assert response.status_code == 200
    assert "mock_provider" in response.json()["warnings"]
    assert client.get("/api/health").json()["provider"] == "mock"


def test_adapter_unavailable_without_explicit_injection(client):
    response = client.post("/api/chat", json=payload())
    assert response.status_code == 400
    assert response.json()["detail"]["code"] == "invalid_input"


@pytest.mark.parametrize("mode", ["eleve", "enseignant", "audit"])
def test_simulated_adapter_through_fastapi_for_all_modes(client, mode):
    def handler(request):
        assert request.headers["Authorization"] == "Bearer " + SECRET
        assert request.url.host == "albert.api.etalab.gouv.fr"
        assert request.url.path == "/v1/chat/completions"
        return httpx.Response(200, json={
            "choices": [{"message": {"content": "Réponse pédagogique simulée"},
                         "finish_reason": "stop"}]
        })
    app.dependency_overrides[get_albert_adapter] = lambda: make_adapter(handler)
    response = client.post("/api/chat", json=payload(mode=mode))
    assert response.status_code == 200
    data = response.json()
    assert data["reply"] == "Réponse pédagogique simulée"
    assert data["model_id"] == MODEL
    assert data["finish_reason"] == "stop"
    assert "simulated_provider_transport" in data["warnings"]
    assert SECRET not in response.text


@pytest.mark.parametrize("upstream,expected,code", [
    (401, 503, "provider_auth_failed"),
    (403, 503, "provider_auth_failed"),
    (429, 429, "provider_rate_limited"),
    (500, 502, "provider_unavailable"),
])
def test_error_mapping_and_no_sensitive_data(client, upstream, expected, code):
    app.dependency_overrides[get_albert_adapter] = lambda: make_adapter(
        lambda request: httpx.Response(upstream, text=MARKER + SECRET)
    )
    response = client.post("/api/chat", json=payload(message=MARKER))
    assert response.status_code == expected
    assert response.json()["detail"]["code"] == code
    assert SECRET not in response.text
    assert MARKER not in response.text


def test_model_rejected_before_transport(client):
    def fail(request):
        raise AssertionError("Unexpected outbound request")
    app.dependency_overrides[get_albert_adapter] = lambda: make_adapter(fail)
    response = client.post("/api/chat", json=payload(model="unknown-model"))
    assert response.status_code == 400
    assert response.json()["detail"]["code"] == "model_not_allowed"


def test_mock_stays_mock_even_with_adapter_injected(client):
    def fail(request):
        raise AssertionError("Unexpected outbound request")
    app.dependency_overrides[get_albert_adapter] = lambda: make_adapter(fail)
    response = client.post("/api/chat", json=payload(model="microalbert-mock"))
    assert response.status_code == 200
    assert "mock_provider" in response.json()["warnings"]
