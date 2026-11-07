"""G3-P2B-R1: offline model discovery tests."""
import asyncio
import httpx
import pytest
from app.albert_adapter import AlbertAdapter, ProviderConfig, ProviderError

CONFIG = ProviderConfig(
    base_url="https://albert.api.etalab.gouv.fr",
    allowed_models=frozenset({"approved-chat", "embedding-not-allowed"}),
)


def discover(handler):
    instance = AlbertAdapter(
        CONFIG, token="FAKE_TEST_TOKEN",
        transport=httpx.MockTransport(handler),
    )
    return asyncio.run(instance.list_allowed_chat_models())


def test_discovery_filters_type_and_allowlist():
    def handler(request):
        assert request.method == "GET"
        assert request.url.path == "/v1/models"
        assert request.headers["Authorization"] == "Bearer FAKE_TEST_TOKEN"
        return httpx.Response(200, json={"data": [
            {"id": "approved-chat", "type": "text-generation"},
            {"id": "approved-chat", "type": "text-generation"},
            {"id": "embedding-not-allowed", "type": "embeddings"},
            {"id": "unlisted-chat", "type": "text-generation"},
        ]})
    assert discover(handler) == ["approved-chat"]


@pytest.mark.parametrize("payload", [
    {}, {"data": {}}, {"data": [None]},
    {"data": [{"id": 1, "type": "text-generation"}]},
])
def test_discovery_rejects_invalid_payload(payload):
    with pytest.raises(ProviderError) as err:
        discover(lambda request: httpx.Response(200, json=payload))
    assert (err.value.code, err.value.status) == ("provider_invalid_response", 502)


@pytest.mark.parametrize("status,code,local_status", [
    (401, "provider_auth_failed", 503),
    (403, "provider_auth_failed", 503),
    (429, "provider_rate_limited", 429),
    (503, "provider_busy", 503),
    (500, "provider_unavailable", 502),
])
def test_discovery_safe_errors(status, code, local_status):
    with pytest.raises(ProviderError) as err:
        discover(lambda request: httpx.Response(status, text="SENSITIVE_REMOTE_BODY"))
    assert (err.value.code, err.value.status) == (code, local_status)
    assert "SENSITIVE_REMOTE_BODY" not in str(err.value)


def test_discovery_rejects_oversized_response():
    with pytest.raises(ProviderError) as err:
        discover(lambda request: httpx.Response(200, content=b"x" * 300_000))
    assert err.value.code == "provider_response_too_large"
