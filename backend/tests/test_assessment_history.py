"""Regression tests: authenticated, server-owned diagnostic history."""
import pytest
from fastapi.testclient import TestClient
from app.main import (app, get_secure_registry, get_secure_limiter,
                      get_assessment_history)
from app.access_security import LocalTokenRegistry, FixedWindowRateLimiter, Principal
from app.assessment_history import AssessmentHistoryStore

BAD = "def enfiler(f, v):\n pass\ndef defiler(f):\n pass"
GOOD = "def enfiler(f, v):\n f.append(v)\ndef defiler(f):\n return f.pop(0)"

@pytest.fixture
def client_and_registry():
    registry = LocalTokenRegistry()
    app.dependency_overrides[get_secure_registry] = lambda: registry
    app.dependency_overrides[get_secure_limiter] = lambda: FixedWindowRateLimiter(limit=100)
    history = AssessmentHistoryStore()
    app.dependency_overrides[get_assessment_history] = lambda: history
    try:
        with TestClient(app) as client:
            yield client, registry
    finally:
        app.dependency_overrides.clear()

def post(client, token, source=BAD, **extra):
    return client.post("/api/secure/assessment",
                       headers={"Authorization": "Bearer " + token},
                       json={"mission_id": "file", "source": source, **extra})

def test_rotation_cannot_be_reset_or_injected_by_browser(client_and_registry):
    client, registry = client_and_registry
    token = registry.issue(Principal("teacher-a", "enseignant"))
    first = post(client, token, previous_finding="missing_return")
    second = post(client, token, previous_finding="empty_body")
    assert first.status_code == second.status_code == 200
    assert first.json()["finding_code"] == "empty_body"
    assert second.json()["finding_code"] == "missing_return"
    assert "def enfiler" not in second.json()["next_question"]

def test_history_is_isolated_by_authenticated_identity(client_and_registry):
    client, registry = client_and_registry
    a = registry.issue(Principal("teacher-a", "enseignant"))
    b = registry.issue(Principal("teacher-b", "enseignant"))
    assert post(client, a).json()["finding_code"] == "empty_body"
    assert post(client, b).json()["finding_code"] == "empty_body"
    assert post(client, a).json()["finding_code"] == "missing_return"

def test_current_report_resets_stale_finding(client_and_registry):
    client, registry = client_and_registry
    token = registry.issue(Principal("teacher-a", "enseignant"))
    assert post(client, token).json()["finding_code"] == "empty_body"
    assert post(client, token, GOOD).json()["finding_code"] is None
    assert post(client, token).json()["finding_code"] == "empty_body"

def test_anonymous_and_student_cannot_change_history(client_and_registry):
    client, registry = client_and_registry
    teacher = registry.issue(Principal("teacher-a", "enseignant"))
    student = registry.issue(Principal("student", "eleve"))
    assert post(client, student).status_code == 403
    assert client.post("/api/secure/assessment",
        json={"mission_id": "file", "source": BAD}).status_code == 401
    assert post(client, teacher).json()["finding_code"] == "empty_body"

def test_ttl_capacity_and_no_source_retention():
    t = [0.0]
    history = AssessmentHistoryStore(ttl_seconds=10, max_sessions=1, clock=lambda: t[0])
    report = {"findings": [{"code": "empty_body"}, {"code": "missing_return"}]}
    assert history.select_and_record("a", "file", report, "verification")[1] == "empty_body"
    assert history.select_and_record("a", "file", report, "verification")[1] == "missing_return"
    history.select_and_record("b", "file", report, "verification")
    assert history.select_and_record("a", "file", report, "verification")[1] == "empty_body"
    t[0] = 11.0
    assert history.select_and_record("a", "file", report, "verification")[1] == "empty_body"
    assert len(history._entries) == 1
    assert all(isinstance(k, tuple) and len(k) == 2 for k in history._entries)

def test_invalid_configuration_and_key():
    with pytest.raises(ValueError):
        AssessmentHistoryStore(ttl_seconds=0)
    with pytest.raises(ValueError):
        AssessmentHistoryStore(max_sessions=0)
    with pytest.raises(ValueError):
        AssessmentHistoryStore().select_and_record("", "file", {}, "verification")
