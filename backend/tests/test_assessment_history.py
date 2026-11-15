"""Regression tests: authenticated, server-owned diagnostic history."""
import pytest
from fastapi.testclient import TestClient
from app.main import (app, get_secure_registry, get_secure_limiter,
                      get_assessment_history, get_assessment_sessions)
from app.access_security import LocalTokenRegistry, FixedWindowRateLimiter, Principal
from app.assessment_history import AssessmentHistoryStore
from app.assessment_sessions import AssessmentSessionStore

BAD = "def enfiler(f, v):\n pass\ndef defiler(f):\n pass"
GOOD = "def enfiler(f, v):\n f.append(v)\ndef defiler(f):\n return f.pop(0)"

@pytest.fixture
def client_and_registry():
    registry = LocalTokenRegistry()
    app.dependency_overrides[get_secure_registry] = lambda: registry
    app.dependency_overrides[get_secure_limiter] = lambda: FixedWindowRateLimiter(limit=100)
    history = AssessmentHistoryStore()
    sessions = AssessmentSessionStore()
    app.dependency_overrides[get_assessment_history] = lambda: history
    app.dependency_overrides[get_assessment_sessions] = lambda: sessions
    try:
        with TestClient(app) as client:
            yield client, registry
    finally:
        app.dependency_overrides.clear()

def post(client, token, source=BAD, **extra):
    # A distinct authenticated capability is mandatory since the security hardening.
    # Reuse the capability per token so longitudinal assertions remain meaningful.
    if not hasattr(client, "_assessment_test_sessions"):
        client._assessment_test_sessions = {}
    if token not in client._assessment_test_sessions:
        response = client.post(
            "/api/secure/assessment/session",
            headers={"Authorization": "Bearer " + token},
            json={"mission_id": "file"},
        )
        if response.status_code != 200:
            return response
        client._assessment_test_sessions[token] = response.json()["session_id"]
    return client.post("/api/secure/assessment",
                       headers={"Authorization": "Bearer " + token},
                       json={"mission_id": "file", "source": source,
                             "session_id": client._assessment_test_sessions[token], **extra})

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


def test_longitudinal_trend_tracks_evidence_not_correctness(client_and_registry):
    client, registry = client_and_registry
    token = registry.issue(Principal("teacher-trend", "enseignant"))
    first = post(client, token, BAD).json()
    assert first["trend"] == {
        "attempts_observed": 1, "persistent_findings": [],
        "new_findings": [], "resolved_findings": [],
        "comparison_available": False,
    }
    second = post(client, token, BAD).json()
    assert second["trend"]["persistent_findings"] == ["empty_body", "missing_return"]
    assert second["trend"]["attempts_observed"] == 2
    third = post(client, token, GOOD).json()
    assert third["trend"]["resolved_findings"] == ["empty_body", "missing_return"]
    assert third["functional_correctness"] == "not_evaluated"
    assert third["trend"]["comparison_available"] is True
    fourth = post(client, token, BAD).json()
    assert fourth["trend"]["new_findings"] == ["empty_body", "missing_return"]
    assert fourth["trend"]["attempts_observed"] == 4


def test_trend_isolated_and_expires_without_storing_source():
    clock = [0.0]
    store = AssessmentHistoryStore(ttl_seconds=5, clock=lambda: clock[0])
    bad = {"findings": [{"code": "missing_return"}]}
    good = {"findings": []}
    first = store.select_record_with_trend("teacher-a", "file", bad, "verification")[2]
    assert not first["comparison_available"]
    second = store.select_record_with_trend("teacher-a", "file", good, "verification")[2]
    assert second["resolved_findings"] == ["missing_return"]
    other = store.select_record_with_trend("teacher-b", "file", bad, "verification")[2]
    assert not other["comparison_available"]
    assert all(len(entry) == 4 for entry in store._entries.values())
    assert all("def " not in str(entry) for entry in store._entries.values())
    clock[0] = 6.0
    expired = store.select_record_with_trend("teacher-a", "file", bad, "verification")[2]
    assert expired["attempts_observed"] == 1
    assert not expired["comparison_available"]


def test_invalid_phase_does_not_advance_trend():
    store = AssessmentHistoryStore()
    report = {"findings": [{"code": "missing_return"}]}
    with pytest.raises(ValueError):
        store.select_record_with_trend("teacher", "file", report, "unknown")
    assert not store._entries
    assert store.select_record_with_trend("teacher", "file", report, "verification")[2]["attempts_observed"] == 1

def test_persistent_difficulty_prompts_metacognitive_step():
    store = AssessmentHistoryStore()
    report = {"findings": [{"code": "missing_return"}]}
    first = store.select_record_with_trend("teacher", "file", report, "verification")
    second = store.select_record_with_trend("teacher", "file", report, "verification")
    third = store.select_record_with_trend("teacher", "file", report, "verification")
    assert first[1] == second[1] == third[1] == "missing_return"
    assert "petit exemple" in third[0]
    assert third[2]["persistent_findings"] == ["missing_return"]
    assert third[2]["attempts_observed"] == 3


def test_resolved_findings_prompt_for_functional_tests_not_success():
    store = AssessmentHistoryStore()
    bad = {"findings": [{"code": "missing_return"}]}
    clean = {"findings": []}
    store.select_record_with_trend("teacher", "file", bad, "verification")
    question, code, trend = store.select_record_with_trend("teacher", "file", clean, "verification")
    assert code is None
    assert "tests" in question
    assert "cas limites" in question
    assert trend["resolved_findings"] == ["missing_return"]
    assert trend["comparison_available"] is True


def test_new_difficulty_keeps_specific_socratic_question():
    store = AssessmentHistoryStore()
    store.select_record_with_trend("teacher", "file",
                                   {"findings": [{"code": "missing_return"}]}, "verification")
    for _ in range(2):
        store.select_record_with_trend("teacher", "file",
                                      {"findings": [{"code": "missing_return"}]}, "verification")
    question, code, trend = store.select_record_with_trend(
        "teacher", "file",
        {"findings": [{"code": "syntax"}, {"code": "missing_return"}]}, "verification")
    assert code == "syntax"
    assert "ligne" in question
    assert trend["new_findings"] == ["syntax"]


def test_no_cross_teacher_metacognitive_escalation():
    store = AssessmentHistoryStore()
    report = {"findings": [{"code": "missing_return"}]}
    for _ in range(3):
        store.select_record_with_trend("teacher-a", "file", report, "verification")
    question, _, trend = store.select_record_with_trend("teacher-b", "file", report, "verification")
    assert "petit exemple" not in question
    assert trend["attempts_observed"] == 1


@pytest.mark.parametrize("phase", ["decouverte", "recherche", "bilan"])
def test_non_coding_phases_never_escalate_to_debugging(phase):
    store = AssessmentHistoryStore()
    report = {"findings": [{"code": "missing_return"}]}
    for _ in range(4):
        question, code, trend = store.select_record_with_trend(
            "teacher", "file", report, phase)
    assert "petit exemple" not in question
    assert trend["attempts_observed"] == 4
    assert code == "missing_return"


@pytest.mark.parametrize("phase", ["implementation", "verification"])
def test_coding_phases_keep_metacognitive_escalation(phase):
    store = AssessmentHistoryStore()
    report = {"findings": [{"code": "missing_return"}]}
    for _ in range(3):
        question, code, trend = store.select_record_with_trend(
            "teacher", "file", report, phase)
    assert "petit exemple" in question
    assert code == "missing_return"
    assert trend["persistent_findings"] == ["missing_return"]


def test_clean_report_does_not_imply_correctness_in_discovery():
    store = AssessmentHistoryStore()
    bad = {"findings": [{"code": "missing_return"}]}
    store.select_record_with_trend("teacher", "file", bad, "decouverte")
    question, code, trend = store.select_record_with_trend(
        "teacher", "file", {"findings": []}, "decouverte")
    assert "cas limites" not in question
    assert code is None
    assert trend["resolved_findings"] == ["missing_return"]


@pytest.mark.parametrize("phase,fragment", [
    ("decouverte", "premier entré"),
    ("recherche", "opérations"),
    ("bilan", "pile"),
])
def test_conceptual_phases_use_conceptual_questions_even_with_diagnostics(phase, fragment):
    store = AssessmentHistoryStore()
    report = {"findings": [{"code": "syntax"}, {"code": "missing_return"}]}
    for _ in range(4):
        question, code, trend = store.select_record_with_trend(
            "teacher", "file", report, phase)
        assert fragment in question
        assert "ligne signalée" not in question
        assert "petit exemple" not in question
        assert code == "syntax"
    assert trend["attempts_observed"] == 4
    assert trend["persistent_findings"] == ["missing_return", "syntax"]


def test_implementation_still_provides_specific_diagnostic_question():
    store = AssessmentHistoryStore()
    question, code, _ = store.select_record_with_trend(
        "teacher", "file", {"findings": [{"code": "syntax"}]}, "implementation")
    assert code == "syntax"
    assert "ligne" in question


def test_conceptual_phase_with_clean_report_does_not_claim_success():
    store = AssessmentHistoryStore()
    question, code, trend = store.select_record_with_trend(
        "teacher", "file", {"findings": []}, "bilan")
    assert "pile" in question
    assert code is None
    assert trend["comparison_available"] is False
