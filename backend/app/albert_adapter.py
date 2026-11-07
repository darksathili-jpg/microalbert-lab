"""G3-P1: Albert-compatible HTTP adapter, test-only; not wired into FastAPI.

Protocol paths/payloads are provisional until checked against current official docs.
A caller MUST inject an httpx.MockTransport during G3-P1 verification.
No key is read from the environment by this module.
"""
from __future__ import annotations

from dataclasses import dataclass
from urllib.parse import urlsplit
import httpx

OFFICIAL_HOST = "albert.api.etalab.gouv.fr"
MAX_RESPONSE_BYTES = 262_144


class ProviderError(Exception):
    """Safe, fixed error code; never contains remote response or credentials."""

    def __init__(self, code: str, status: int):
        super().__init__(code)
        self.code = code
        self.status = status


@dataclass(frozen=True)
class ProviderConfig:
    base_url: str
    allowed_models: frozenset[str]
    timeout_seconds: float = 15.0

    def __post_init__(self):
        url = urlsplit(self.base_url)
        if (url.scheme != "https" or url.hostname != OFFICIAL_HOST
                or url.username or url.password or url.port not in (None, 443)
                or url.path not in ("", "/") or url.query or url.fragment):
            raise ValueError("invalid_provider_origin")
        if not self.allowed_models or any(
            not model or len(model) > 120 or any(ch.isspace() for ch in model)
            for model in self.allowed_models
        ):
            raise ValueError("invalid_model_allowlist")
        if not 1 <= self.timeout_seconds <= 30:
            raise ValueError("invalid_timeout")


@dataclass(frozen=True)
class ProviderReply:
    reply: str
    model_id: str
    finish_reason: str | None


class AlbertAdapter:
    """Transport-injected adapter. Never logs messages, tokens or remote bodies."""

    def __init__(self, config: ProviderConfig, *, token: str,
                 transport: httpx.BaseTransport | httpx.AsyncBaseTransport):
        if not token or not token.strip():
            raise ProviderError("provider_not_configured", 503)
        if transport is None:
            raise ValueError("transport_required")
        self.config = config
        self._token = token
        self._transport = transport

    async def chat(self, model_id: str, message: str) -> ProviderReply:
        if model_id not in self.config.allowed_models:
            raise ProviderError("model_not_allowed", 400)
        if not message.strip() or len(message) > 4000:
            raise ProviderError("invalid_input", 422)
        try:
            async with httpx.AsyncClient(
                transport=self._transport,
                timeout=httpx.Timeout(self.config.timeout_seconds),
                follow_redirects=False,
                trust_env=False,
            ) as client:
                async with client.stream(
                    "POST",
                    self.config.base_url.rstrip("/") + "/v1/chat/completions",
                    headers={"Authorization": f"Bearer {self._token}"},
                    json={"model": model_id, "messages": [{"role": "user", "content": message}]},
                ) as response:
                    if response.status_code in (401, 403):
                        raise ProviderError("provider_auth_failed", 503)
                    if response.status_code == 429:
                        raise ProviderError("provider_rate_limited", 429)
                    if response.status_code >= 500:
                        raise ProviderError("provider_unavailable", 502)
                    if response.status_code != 200:
                        raise ProviderError("provider_rejected", 502)
                    body = bytearray()
                    async for chunk in response.aiter_bytes():
                        body.extend(chunk)
                        if len(body) > MAX_RESPONSE_BYTES:
                            raise ProviderError("provider_response_too_large", 502)
                    try:
                        payload = httpx.Response(200, content=bytes(body)).json()
                        choice = payload["choices"][0]
                        reply = choice["message"]["content"]
                        reason = choice.get("finish_reason")
                        if (not isinstance(reply, str) or not reply.strip()
                                or len(reply) > 100_000
                                or (reason is not None and not isinstance(reason, str))):
                            raise ValueError("invalid_response")
                    except (KeyError, IndexError, TypeError, ValueError):
                        raise ProviderError("provider_invalid_response", 502) from None
                    return ProviderReply(reply=reply, model_id=model_id, finish_reason=reason)
        except httpx.TimeoutException:
            raise ProviderError("provider_timeout", 504) from None
        except httpx.RequestError:
            raise ProviderError("provider_unavailable", 502) from None
