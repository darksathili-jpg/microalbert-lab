"""G4-P3: deterministic educational mission on FIFO queues.

No dynamic Python execution, no Albert API, no student data persistence.
"""
from dataclasses import dataclass
from typing import Literal
import ast

MissionPhase = Literal["decouverte", "recherche", "implementation", "verification", "bilan"]
MISSION_ID = "G4P3-FILE-01"


@dataclass(frozen=True)
class Mission:
    identifier: str
    title: str
    level: str
    objective: str
    starter_code: str
    example_calls: tuple[str, ...]
    test_cases: tuple[str, ...]


MISSION = Mission(
    identifier=MISSION_ID,
    title="Une file de messages à traiter",
    level="Terminale NSI",
    objective="Écrire deux fonctions sur une file représentée par une liste et justifier l'ordre premier entré, premier sorti (FIFO).",
    starter_code=(
        "def enfiler(file, valeur):\n"
        "    # Ajouter valeur à la fin de la liste file.\n"
        "    pass\n\n"
        "def defiler(file):\n"
        "    # Retirer et renvoyer le premier élément ; None si la file est vide.\n"
        "    pass\n"
    ),
    example_calls=(
        "f = [] ; enfiler(f, 7) ; enfiler(f, 4) ; f  # attendu : [7, 4]",
        "defiler([7, 4])  # valeur renvoyée attendue : 7",
        "defiler([])  # valeur renvoyée attendue : None",
    ),
    test_cases=(
        "File initialement vide : insertion de deux valeurs puis retrait",
        "Retrait d'une file vide",
        "Conservation de l'ordre d'arrivée",
    ),
)


class MissionSubmissionError(ValueError):
    pass


def inspect_student_code(source: str) -> dict[str, object]:
    """Static structural inspection; never executes arbitrary student code."""
    if not isinstance(source, str) or not source.strip() or len(source) > 8000:
        raise MissionSubmissionError("invalid_submission")
    try:
        tree = ast.parse(source)
    except (SyntaxError, ValueError, RecursionError):
        return {"syntax_valid": False, "functions_present": [], "needs_execution": False}
    found = {
        node.name for node in tree.body
        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef))
        and node.name in {"enfiler", "defiler"}
    }
    return {
        "syntax_valid": True,
        "functions_present": sorted(found),
        "needs_execution": True,
        "feedback": (
            "Analyse syntaxique seulement : exécuter des tests dans un bac à sable "
            "séparé avant de valider la correction."
        ),
    }


def mission_feedback(phase: MissionPhase, code: str | None = None) -> str:
    if phase == "decouverte":
        return "Que signifie « premier entré, premier sorti » ? Donne un exemple concret."
    if phase == "recherche":
        return "Quelle opération sur une liste permet de placer un élément en fin de file ?"
    if phase == "implementation":
        if code is None:
            return "Écris toi-même les fonctions enfiler et defiler à partir du squelette."
        result = inspect_student_code(code)
        if not result["syntax_valid"]:
            return "Le code contient une erreur de syntaxe : examine le message de l'interpréteur."
        if len(result["functions_present"]) < 2:
            return "Vérifie que les deux fonctions demandées sont définies."
        return "Les deux fonctions sont présentes : propose des appels et vérifie les valeurs renvoyées."
    if phase == "verification":
        return "Propose un test pour la file vide et un test de conservation de l'ordre."
    if phase == "bilan":
        return "Explique pourquoi cette structure est une file et non une pile."
    raise MissionSubmissionError("invalid_phase")
