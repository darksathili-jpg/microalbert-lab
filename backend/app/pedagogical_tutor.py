"""G4-P2 offline pedagogical tutor policy; no model calls or student data storage.

A policy decision is NOT a proof that a language model will obey instructions.
The server must enforce access and assessment controls independently.
"""
from dataclasses import dataclass
from enum import Enum
from typing import Literal

Phase = Literal["decouverte", "recherche", "implementation", "verification", "bilan"]
MAX_HINTS = 3


class TutorAction(str, Enum):
    REFORMULATE = "reformulate"
    ASK_REASONING = "ask_reasoning"
    GUIDE_DEBUG = "guide_debug"
    REVIEW_ATTEMPT = "review_attempt"
    HINT = "hint"
    TRANSFER = "transfer"
    ASK_FOR_ATTEMPT = "ask_for_attempt"


@dataclass(frozen=True)
class TutorContext:
    mission_id: str
    phase: Phase
    attempts: int
    hints_used: int
    requested_solution: bool = False
    has_student_work: bool = False
    assessment_locked: bool = True


@dataclass(frozen=True)
class TutorDecision:
    action: TutorAction
    instruction: str
    reveal_solution: bool
    hints_remaining: int


INSTRUCTIONS = {
    TutorAction.REFORMULATE: "Reformule la consigne sans donner l'algorithme ni le code.",
    TutorAction.ASK_REASONING: "Demande à l'élève de décrire sa stratégie et de justifier une étape.",
    TutorAction.GUIDE_DEBUG: "Demande un test précis, une trace ou la valeur renvoyée, sans corriger à sa place.",
    TutorAction.REVIEW_ATTEMPT: "Questionne une hypothèse et propose un cas limite sans donner le corrigé.",
    TutorAction.HINT: "Donne un indice conceptuel bref, sans code de solution ni pseudocode complet.",
    TutorAction.TRANSFER: "Propose une variante pour vérifier que l'élève sait transférer sa méthode.",
    TutorAction.ASK_FOR_ATTEMPT: "Demande une tentative personnelle avant de proposer une nouvelle aide.",
}


def decide_tutor_action(context: TutorContext) -> TutorDecision:
    if not context.mission_id or context.attempts < 0 or not 0 <= context.hints_used <= MAX_HINTS:
        raise ValueError("invalid_tutor_context")
    remaining = MAX_HINTS - context.hints_used
    if context.requested_solution:
        action = TutorAction.ASK_FOR_ATTEMPT if not context.has_student_work else TutorAction.REVIEW_ATTEMPT
    elif context.phase == "decouverte":
        action = TutorAction.REFORMULATE
    elif context.phase == "recherche":
        action = TutorAction.ASK_REASONING
    elif context.phase == "implementation":
        action = TutorAction.GUIDE_DEBUG if context.has_student_work else TutorAction.ASK_FOR_ATTEMPT
    elif context.phase == "verification":
        action = TutorAction.REVIEW_ATTEMPT if context.has_student_work else TutorAction.ASK_FOR_ATTEMPT
    elif context.phase == "bilan":
        action = TutorAction.TRANSFER if context.has_student_work else TutorAction.ASK_FOR_ATTEMPT
    else:
        raise ValueError("invalid_phase")
    if action == TutorAction.ASK_FOR_ATTEMPT and context.attempts > 0 and remaining:
        action = TutorAction.HINT
    return TutorDecision(action, INSTRUCTIONS[action], False, remaining)


def tutor_system_instructions(decision: TutorDecision) -> str:
    """Instruction for a future model, not a sufficient anti-leak safeguard."""
    return (
        "Tu es un tuteur de spécialité Numérique et sciences informatiques (NSI). "
        "Tu accompagnes les élèves de Première et Terminale selon leur niveau et la mission. "
        "Emploie le vocabulaire du Bulletin officiel : variable de type entier, "
        "affecter une valeur, boucle bornée (for), boucle non bornée (while), instruction. "
        "N'utilise jamais le mot boucle infinie comme synonyme de boucle non bornée. "
        "Réponds en français avec une explication courte et une question de vérification. "
        "Tu accompagnes par questionnement et vérification, sans fournir de corrigé. "
        "Respecte le vocabulaire des programmes officiels. "
        "N'affirme jamais qu'une réponse est validée sans test indépendant. "
        "Ne demande aucune donnée personnelle. "
        "Ne fournis ni solution complète, ni code final, ni pseudocode qui résout entièrement la mission. "
        + decision.instruction
    )
