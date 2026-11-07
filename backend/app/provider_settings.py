"""G3-P3: fail-closed settings parser. Does not activate an HTTP provider."""
from __future__ import annotations

from dataclasses import dataclass
from collections.abc import Mapping
import os

from .albert_adapter import ProviderConfig


class ConfigurationError(ValueError):
    """Fixed, non-sensitive error: never include environment values."""


@dataclass(frozen=True)
class ProviderSettings:
    mode: str
    config: ProviderConfig | None
    credential_present: bool


def parse_provider_settings(env: Mapping[str, str]) -> ProviderSettings:
    """Validate explicit settings without returning, logging or using the secret."""
    mode = env.get("MICROALBERT_PROVIDER", "mock")
    if mode not in ("mock", "albert"):
        raise ConfigurationError("invalid_provider_mode")
    if mode == "mock":
        return ProviderSettings(mode="mock", config=None, credential_present=False)

    # An explicit real-mode selection is NOT authorization to send traffic.
    if env.get("MICROALBERT_REAL_ACCESS_APPROVED") != "yes":
        raise ConfigurationError("real_provider_not_approved")
    raw_models = env.get("ALBERT_ALLOWED_MODELS", "")
    models = raw_models.split(",")
    if not raw_models or len(models) > 20 or any(m != m.strip() for m in models):
        raise ConfigurationError("invalid_model_allowlist")
    token = env.get("ALBERT_API_KEY", "")
    if not token or token != token.strip() or any(ch.isspace() for ch in token):
        raise ConfigurationError("missing_or_invalid_credential")
    try:
        timeout = float(env.get("ALBERT_TIMEOUT_SECONDS", "15"))
        config = ProviderConfig(
            base_url=env.get("ALBERT_API_BASE_URL", "https://albert.api.etalab.gouv.fr"),
            allowed_models=frozenset(models),
            timeout_seconds=timeout,
        )
    except (ValueError, OverflowError):
        raise ConfigurationError("invalid_provider_configuration") from None
    return ProviderSettings(mode="albert", config=config, credential_present=True)


def inspect_local_settings() -> ProviderSettings:
    """Opt-in inspection only; never invoked by the API's default dependency."""
    return parse_provider_settings(os.environ)
