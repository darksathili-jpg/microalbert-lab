"""G4-P3: original queue mission tests, without executing student Python."""
import pytest

from app.nsi_mission import (
    MISSION, MISSION_ID, MissionSubmissionError, inspect_student_code, mission_feedback
)


def test_mission_metadata():
    assert MISSION.identifier == MISSION_ID
    assert MISSION.level == "Terminale NSI"
    assert len(MISSION.example_calls) == 3
    assert len(MISSION.test_cases) == 3


def test_starter_contains_two_functions():
    result = inspect_student_code(MISSION.starter_code)
    assert result["syntax_valid"] is True
    assert result["functions_present"] == ["defiler", "enfiler"]


def test_syntax_error_gives_non_executing_feedback():
    result = inspect_student_code("def enfiler(:\n pass")
    assert result["syntax_valid"] is False
    assert result["needs_execution"] is False


def test_missing_function_detected():
    result = inspect_student_code("def enfiler(file, valeur):\n    pass\n")
    assert result["functions_present"] == ["enfiler"]


def test_no_execution_of_untrusted_python():
    marker = "__import__('os').system('echo SHOULD_NOT_EXECUTE')"
    result = inspect_student_code(marker)
    assert result["syntax_valid"] is True
    assert result["functions_present"] == []


@pytest.mark.parametrize("source", ["", "  ", "x" * 8001])
def test_invalid_submissions(source):
    with pytest.raises(MissionSubmissionError):
        inspect_student_code(source)


@pytest.mark.parametrize("phase", ["decouverte", "recherche", "verification", "bilan"])
def test_phases_ask_questions_without_answer(phase):
    text = mission_feedback(phase)
    assert len(text) > 10
    assert "def enfiler" not in text
    assert "def defiler" not in text


def test_implementation_requests_student_code():
    assert "Écris toi-même" in mission_feedback("implementation")


def test_implementation_syntax_feedback():
    assert "syntaxe" in mission_feedback("implementation", "def defiler(:\n pass")


def test_implementation_complete_structure_not_certified():
    result = mission_feedback("implementation", MISSION.starter_code)
    assert "propose des appels" in result
    assert "correct" not in result.lower()


def test_invalid_phase():
    with pytest.raises(MissionSubmissionError):
        mission_feedback("other")
