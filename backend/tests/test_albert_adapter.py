"""G3-P1: offline contract tests. Every HTTP request uses MockTransport."""
import asyncio
import httpx
import pytest
from app.albert_adapter import AlbertAdapter, ProviderConfig, ProviderError

ORIGIN = "https://albert.api.etalab.gouv.fr"
CONFIG = ProviderConfig(base_url=ORIGIN, allowed_models=frozenset({"test-chat"}))


def adapter(handler, *, token="TEST_TOKEN_NOT_REAL", config=CONFIG):
    return AlbertAdapter(config, token=token, transport=httpx.MockTransport(handler))


def call(instance, model="test-chat", message="Bonjour, question fictive"):
    return asyncio.run(instance.chat(model, message))


def expect_error(instance, code, status, model="test-chat"):
    with pytest.raises(ProviderError) as err:
        call(instance, model=model)
    assert (err.value.code, err.value.status) == (code, status)
    assert "TEST_TOKEN_NOT_REAL" not in str(err.value)


def test_success_and_request_contract():
    def handler(request):
        assert request.url.host == "albert.api.etalab.gouv.fr"
        assert request.url.path == "/v1/chat/completions"
        assert request.headers["Authorization"] == "Bearer TEST_TOKEN_NOT_REAL"
        assert request.method == "POST"
        assert request.read()
        return httpx.Response(200, json={"choices": [{
            "message": {"content": "Réponse fictive"}, "finish_reason": "stop"
        }]})
    result = call(adapter(handler))
    assert result.reply == "Réponse fictive"
    assert result.finish_reason == "stop"


@pytest.mark.parametrize("status,code,app_status", [
    (401, "provider_auth_failed", 503),
    (403, "provider_auth_failed", 503),
    (429, "provider_rate_limited", 429),
    (500, "provider_unavailable", 502),
    (503, "provider_unavailable", 502),
    (404, "provider_rejected", 502),
])
def test_status_mapping_without_remote_body(status, code, app_status):
    def handler(request):
        return httpx.Response(status, text="SECRET_REMOTE_BODY_NOT_TO_LEAK")
    instance = adapter(handler)
    with pytest.raises(ProviderError) as err:
        call(instance)
    assert (err.value.code, err.value.status) == (code, app_status)
    assert "SECRET_REMOTE_BODY_NOT_TO_LEAK" not in str(err.value)


def test_timeout():
    def handler(request):
        raise httpx.ReadTimeout("secret upstream trace", request=request)
    expect_error(adapter(handler), "provider_timeout", 504)


def test_transport_failure():
    def handler(request):
        raise httpx.ConnectError("secret remote address", request=request)
    expect_error(adapter(handler), "provider_unavailable", 502)


@pytest.mark.parametrize("payload", [
    {},
    {"choices": []},
    {"choices": [{"message": {"content": ""}}]},
    {"choices": [{"message": {"content": ["not a string"]}}]},
])
def test_invalid_response(payload):
    expect_error(adapter(lambda request: httpx.Response(200, json=payload)),
                 "provider_invalid_response", 502)


def test_oversized_response():
    expect_error(adapter(lambda request: httpx.Response(
        200, content=b"x" * 300_000)), "provider_response_too_large", 502)


def test_reject_unlisted_model_before_transport():
    def must_not_run(request):
        raise AssertionError("network request unexpectedly issued")
    expect_error(adapter(must_not_run), "model_not_allowed", 400, model="embedding-model")


@pytest.mark.parametrize("origin", [
    "http://albert.api.etalab.gouv.fr",
    "https://attacker.example",
    "https://albert.api.etalab.gouv.fr.attacker.example",
    "https://user:password@albert.api.etalab.gouv.fr",
    "https://albert.api.etalab.gouv.fr:8080",
    "https://albert.api.etalab.gouv.fr/redirect",
    "https://albert.api.etalab.gouv.fr?next=evil",
])
def test_reject_non_official_origin(origin):
    with pytest.raises(ValueError, match="invalid_provider_origin"):
        ProviderConfig(base_url=origin, allowed_models=frozenset({"test-chat"}))


def test_missing_token_fails_closed():
    with pytest.raises(ProviderError) as err:
        adapter(lambda request: httpx.Response(200), token="")
    assert err.value.status == 503


def test_no_transport_fails_closed():
    with pytest.raises(ValueError, match="transport_required"):
        AlbertAdapter(CONFIG, token="TEST_TOKEN_NOT_REAL", transport=None)


def test_invalid_timeout():
    with pytest.raises(ValueError, match="invalid_timeout"):
        ProviderConfig(ORIGIN, frozenset({"test-chat"}), timeout_seconds=60)


def test_mock_backend_unchanged():
    from fastapi.testclient import TestClient
    from app.main import app
    client = TestClient(app)
    assert client.get("/api/health").json() == {"status": "ok", "provider": "mock"}
    assert client.get("/api/models").json()["data"][0]["id"] == "microalbert-mock"
