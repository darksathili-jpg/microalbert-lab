"""G3-P3 security gates: no real HTTP transport is created."""
import pytest

from app.provider_settings import ConfigurationError, parse_provider_settings


def approved(**updates):
    values = {
        "MICROALBERT_PROVIDER": "albert",
        "MICROALBERT_REAL_ACCESS_APPROVED": "yes",
        "ALBERT_API_KEY": "FAKE_ONLY_FOR_TESTS",
        "ALBERT_ALLOWED_MODELS": "approved-model",
    }
    values.update(updates)
    return values


def test_mock_default_ignores_secret():
    settings = parse_provider_settings({"ALBERT_API_KEY": "SHOULD_NOT_BE_READ"})
    assert settings.mode == "mock"
    assert settings.config is None
    assert settings.credential_present is False


def test_mock_explicit_stays_mock():
    assert parse_provider_settings({"MICROALBERT_PROVIDER": "mock"}).mode == "mock"


@pytest.mark.parametrize("env,code", [
    ({"MICROALBERT_PROVIDER": "unknown"}, "invalid_provider_mode"),
    ({"MICROALBERT_PROVIDER": "albert"}, "real_provider_not_approved"),
    (approved(ALBERT_API_KEY=""), "missing_or_invalid_credential"),
    (approved(ALBERT_API_KEY="BAD SECRET"), "missing_or_invalid_credential"),
    (approved(ALBERT_ALLOWED_MODELS=""), "invalid_model_allowlist"),
    (approved(ALBERT_ALLOWED_MODELS="a, b"), "invalid_model_allowlist"),
    (approved(ALBERT_API_BASE_URL="http://albert.api.etalab.gouv.fr"), "invalid_provider_configuration"),
    (approved(ALBERT_API_BASE_URL="https://evil.example"), "invalid_provider_configuration"),
    (approved(ALBERT_TIMEOUT_SECONDS="nan"), "invalid_provider_configuration"),
    (approved(ALBERT_TIMEOUT_SECONDS="0"), "invalid_provider_configuration"),
])
def test_fail_closed_configuration(env, code):
    with pytest.raises(ConfigurationError) as err:
        parse_provider_settings(env)
    assert str(err.value) == code
    assert "FAKE_ONLY_FOR_TESTS" not in str(err.value)


def test_explicit_configuration_is_inspection_only():
    settings = parse_provider_settings(approved())
    assert settings.mode == "albert"
    assert settings.credential_present
    assert settings.config.allowed_models == frozenset({"approved-model"})
    assert not hasattr(settings, "token")
