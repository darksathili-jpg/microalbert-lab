"""Export only fictitious, reproducible examples for the static Pages preview."""
import json
from pathlib import Path

from app.assessment_history import AssessmentHistoryStore
from app.mission_assessment import assess_submission
from app.training_catalog import TRAINING_MISSIONS

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "frontend" / "src" / "training-preview.json"


# These fictitious attempts deliberately produce an incorrect result.
PRACTICE_EXAMPLES = {
    "premiere-somme-filtree": {
        "body": "return 0",
        "expression": "total_seuil([5, 4], 5)",
        "expected": "5",
        "observed": "0",
        "justification": "Vérifier que la mesure égale au seuil est prise en compte.",
    },
    "terminale-parcours-graphe": {
        "body": "return [depart]",
        "expression": "salles_accessibles({'A': ['B'], 'B': ['A']}, 'A')",
        "expected": "['A', 'B']",
        "observed": "['A']",
        "justification": "Vérifier qu’un cycle permet de visiter B sans inscrire A une deuxième fois.",
    },
}


def build_preview():
    history = AssessmentHistoryStore()
    preview = []
    for mission_id, mission in TRAINING_MISSIONS.items():
        examples = []
        practice = PRACTICE_EXAMPLES[mission_id]
        revised = mission.starter_code.replace("pass", practice["body"])
        for source in (mission.starter_code, revised):
            report = assess_submission(source, (mission.function,))
            question, _, trend = history.select_record_with_trend("preview", mission_id, report, "implementation")
            examples.append({
                "source": source,
                "question": question,
                "observations": [finding["question"] for finding in report["findings"]],
                "resolved_diagnostics": len(trend["resolved_findings"]),
                "attempt": trend["attempts_observed"],
            })
        preview.append({
            "id": mission_id,
            "title": mission.title,
            "level": mission.level,
            "statement": mission.statement,
            "reference": mission.source_reference,
            "checks": mission.checks_to_design,
            "test_case": {key: value for key, value in practice.items() if key != "body"},
            "examples": examples,
        })
    return json.dumps(preview, ensure_ascii=False, indent=2) + "\n"


if __name__ == "__main__":
    import sys

    preview = build_preview()
    if sys.argv[1:] == ["--check"]:
        if OUTPUT.read_text(encoding="utf-8") != preview:
            sys.exit("La démonstration doit être régénérée depuis le catalogue.")
    else:
        OUTPUT.write_text(preview, encoding="utf-8")
