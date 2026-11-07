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
def test_legacy_never_uses_injected_provider(client, mode):
    def fail(request):
        raise AssertionError("Unexpected outbound request")
    app.dependency_overrides[get_albert_adapter] = lambda: make_adapter(fail)
    response = client.post("/api/chat", json=payload(mode=mode))
    assert response.status_code == 400
    assert response.json()["detail"]["code"] == "invalid_input"
    assert SECRET not in response.text


@pytest.mark.parametrize("upstream", [401, 403, 429, 500, 503, 404, 422])
def test_legacy_never_reaches_upstream(client, upstream):
    def fail(request):
        raise AssertionError(f"Provider must not be reached: {upstream}")
    app.dependency_overrides[get_albert_adapter] = lambda: make_adapter(fail)
    response = client.post("/api/chat", json=payload(message=MARKER))
    assert response.status_code == 400
    assert SECRET not in response.text
    assert MARKER not in response.text


def test_model_rejected_before_transport(client):
    def fail(request):
        raise AssertionError("Unexpected outbound request")
    app.dependency_overrides[get_albert_adapter] = lambda: make_adapter(fail)
    response = client.post("/api/chat", json=payload(model="unknown-model"))
    assert response.status_code == 400
    assert response.json()["detail"]["code"] == "invalid_input"


def test_mock_stays_mock_even_with_adapter_injected(client):
    def fail(request):
        raise AssertionError("Unexpected outbound request")
    app.dependency_overrides[get_albert_adapter] = lambda: make_adapter(fail)
    response = client.post("/api/chat", json=payload(model="microalbert-mock"))
    assert response.status_code == 200
    assert "mock_provider" in response.json()["warnings"]
