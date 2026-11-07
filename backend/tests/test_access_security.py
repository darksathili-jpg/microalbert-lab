"""G3-P4: independent access-control security checks."""
import pytest

from app.access_security import (
    AccessDenied, FixedWindowRateLimiter, LocalTokenRegistry, Principal, authorize
)


def test_missing_token_rejected():
    registry = LocalTokenRegistry()
    with pytest.raises(AccessDenied) as err:
        registry.authenticate(None)
    assert (err.value.code, err.value.status) == ("authentication_required", 401)


def test_forged_token_rejected():
    registry = LocalTokenRegistry()
    registry.issue(Principal("teacher-1", "enseignant"))
    with pytest.raises(AccessDenied):
        registry.authenticate("Bearer FORGED_TOKEN")


def test_valid_token_maps_to_server_role():
    registry = LocalTokenRegistry()
    token = registry.issue(Principal("learner-1", "eleve"))
    assert registry.authenticate("Bearer " + token) == Principal("learner-1", "eleve")


def test_revoked_token_rejected():
    registry = LocalTokenRegistry()
    token = registry.issue(Principal("teacher-1", "enseignant"))
    registry.revoke(token)
    with pytest.raises(AccessDenied):
        registry.authenticate("Bearer " + token)


@pytest.mark.parametrize("role,requested,permission", [
    ("eleve", "enseignant", "chat:review"),
    ("eleve", "audit", "audit:read"),
    ("enseignant", "audit", "audit:read"),
    ("audit", "enseignant", "chat:review"),
])
def test_role_escalation_rejected(role, requested, permission):
    with pytest.raises(AccessDenied) as err:
        authorize(Principal("user-1", role), requested, permission)
    assert err.value.status == 403


@pytest.mark.parametrize("role,permission", [
    ("eleve", "chat:mock"),
    ("enseignant", "chat:review"),
    ("audit", "audit:read"),
])
def test_valid_role_permission(role, permission):
    authorize(Principal("user-1", role), role, permission)


def test_unassigned_permission_rejected():
    with pytest.raises(AccessDenied):
        authorize(Principal("teacher-1", "enseignant"), "enseignant", "audit:read")


def test_rate_limit_is_per_subject():
    now = [100.0]
    limiter = FixedWindowRateLimiter(limit=2, window_seconds=60, clock=lambda: now[0])
    assert limiter.allow("learner-1")
    assert limiter.allow("learner-1")
    assert not limiter.allow("learner-1")
    assert limiter.allow("learner-2")
    now[0] += 61
    assert limiter.allow("learner-1")


def test_rate_limit_returns_safe_429():
    limiter = FixedWindowRateLimiter(limit=1)
    limiter.require("learner-1")
    with pytest.raises(AccessDenied) as err:
        limiter.require("learner-1")
    assert (err.value.code, err.value.status) == ("rate_limited", 429)


def test_rate_limit_refuses_missing_identity():
    with pytest.raises(AccessDenied):
        FixedWindowRateLimiter().require("")


def test_bad_rate_limit_config_rejected():
    with pytest.raises(ValueError):
        FixedWindowRateLimiter(limit=0)
