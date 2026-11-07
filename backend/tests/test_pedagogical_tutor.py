"""G4-P2: pedagogical tutor policy unit tests, no external provider."""
import pytest
from app.pedagogical_tutor import (
    TutorAction, TutorContext, decide_tutor_action, tutor_system_instructions
)


@pytest.mark.parametrize("phase,has_work,expected", [
    ("decouverte", False, TutorAction.REFORMULATE),
    ("recherche", False, TutorAction.ASK_REASONING),
    ("implementation", True, TutorAction.GUIDE_DEBUG),
    ("implementation", False, TutorAction.ASK_FOR_ATTEMPT),
    ("verification", True, TutorAction.REVIEW_ATTEMPT),
    ("verification", False, TutorAction.ASK_FOR_ATTEMPT),
    ("bilan", True, TutorAction.TRANSFER),
])
def test_scaffolded_phases(phase, has_work, expected):
    result = decide_tutor_action(TutorContext("M01", phase, 0, 0, has_student_work=has_work))
    assert result.action == expected
    assert result.reveal_solution is False


@pytest.mark.parametrize("has_work,expected", [
    (False, TutorAction.ASK_FOR_ATTEMPT),
    (True, TutorAction.REVIEW_ATTEMPT),
])
def test_direct_answer_request_never_reveals_solution(has_work, expected):
    result = decide_tutor_action(TutorContext(
        "M01", "implementation", 0, 0, requested_solution=True, has_student_work=has_work
    ))
    assert result.action == expected
    assert result.reveal_solution is False


def test_hint_after_unsuccessful_attempt():
    result = decide_tutor_action(TutorContext("M01", "implementation", 2, 1))
    assert result.action == TutorAction.HINT
    assert result.hints_remaining == 2


def test_hint_budget_exhausted():
    result = decide_tutor_action(TutorContext("M01", "implementation", 5, 3))
    assert result.action == TutorAction.ASK_FOR_ATTEMPT
    assert result.hints_remaining == 0


def test_instructions_do_not_claim_independent_validation():
    result = decide_tutor_action(TutorContext("M01", "verification", 1, 1, has_student_work=True))
    instructions = tutor_system_instructions(result)
    assert "test indépendant" in instructions
    assert "donnée personnelle" in instructions


@pytest.mark.parametrize("mission,attempts,hints", [
    ("", 0, 0), ("M01", -1, 0), ("M01", 0, -1), ("M01", 0, 4),
])
def test_invalid_context_rejected(mission, attempts, hints):
    with pytest.raises(ValueError):
        decide_tutor_action(TutorContext(mission, "recherche", attempts, hints))
