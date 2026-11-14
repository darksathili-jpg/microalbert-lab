"""Deterministic Socratic assessment dialogue; never executes submitted Python."""
from typing import Literal

Phase = Literal["decouverte", "recherche", "implementation", "verification", "bilan"]

PHASE_QUESTIONS = {
    "decouverte": "Que signifie premier entré, premier sorti pour une file ?",
    "recherche": "Quelles opérations faut-il prévoir pour une file vide et une file non vide ?",
    "implementation": "Quelle partie de ton programme voudrais-tu vérifier en premier ?",
    "verification": "Quels tests permettraient de vérifier le comportement de ta file, notamment lorsqu'elle est vide ?",
    "bilan": "Comment expliquerais-tu la différence entre une file et une pile ?",
}
FOLLOW_UP = {
    "definition_time_effect": "Que peut évaluer Python avant même le premier appel de ta fonction ?",
    "top_level_effect": "Quelles instructions seraient exécutées avant même l'appel de tes fonctions ?",
    "dynamic_execution": "Peux-tu expliquer le rôle de l'évaluation dynamique de texte dans cette mission ?",
    "syntax": "Peux-tu isoler la ligne signalée par Python et expliquer ce qui manque ?",
    "missing_function": "Peux-tu retrouver dans la consigne les fonctions à définir ?",
    "duplicate_definition": "Quelle définition de cette fonction Python conservera-t-il finalement ?",
    "signature": "Quels paramètres la consigne attend-elle pour cette fonction ?",
    "empty_body": "Quel effet observable attends-tu de cette fonction sur la file ?",
    "missing_return": "Quelle différence fais-tu entre modifier la file et renvoyer une valeur ?",
    "decorated_definition": "Peux-tu expliquer ce que change le décorateur au moment de définir la fonction ?",
    "async_definition": "Cette mission nécessite-t-elle une fonction asynchrone ?",
}
PRIORITY = ("syntax", "top_level_effect", "definition_time_effect", "dynamic_execution", "missing_function", "duplicate_definition", "async_definition",
            "decorated_definition", "signature", "empty_body", "missing_return")


def select_question(report: dict, phase: Phase = "verification",
                    previous_finding: str | None = None) -> tuple[str, str | None]:
    """Return (question, finding_code) without trusting a client-supplied diagnosis.

    The previous finding is only a preference to diversify questions; the
    current report remains the sole authority for observable findings.
    """
    if phase not in PHASE_QUESTIONS:
        raise ValueError("invalid_phase")
    findings = report.get("findings", [])
    codes = {finding.get("code") for finding in findings
             if isinstance(finding, dict) and finding.get("code") in FOLLOW_UP}
    for code in PRIORITY:
        if code in codes and code != previous_finding:
            return FOLLOW_UP[code], code
    for code in PRIORITY:
        if code in codes:
            return FOLLOW_UP[code], code
    return PHASE_QUESTIONS[phase], None
