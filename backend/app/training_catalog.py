"""Original training activities mapped to specific NSI examination questions."""

from dataclasses import dataclass
from typing import Literal

TrainingMissionId = Literal["premiere-somme-filtree", "terminale-parcours-graphe"]


@dataclass(frozen=True)
class FunctionRequirement:
    name: str
    arity: int
    returns_value: bool = True


@dataclass(frozen=True)
class TrainingMission:
    title: str
    level: Literal["Première", "Terminale"]
    source_reference: str
    source_url: str
    statement: str
    starter_code: str
    checks_to_design: tuple[str, ...]
    phase_questions: dict[str, str]
    function: FunctionRequirement


TRAINING_MISSIONS: dict[TrainingMissionId, TrainingMission] = {
    "premiere-somme-filtree": TrainingMission(
        title="Totaliser des mesures au-dessus d’un seuil",
        level="Première",
        source_reference="G1SNSIN03316 · sujet-A-1.pdf · thème F, question F.6 · p. 16",
        source_url="https://ccbac.fr/sujets/2020/G/2/NSIN/001/G1SNSIN03316-sujet1.pdf",
        statement=(
            "La fonction total_seuil(mesures, seuil) reçoit une liste de nombres entiers "
            "et un seuil de type entier. Elle renvoie la somme des mesures supérieures "
            "ou égales au seuil, en comptant chaque occurrence. Si aucune mesure ne "
            "convient, elle renvoie 0. La liste reçue doit rester inchangée."
        ),
        starter_code="def total_seuil(mesures, seuil):\n    pass\n",
        checks_to_design=(
            "Liste vide et liste non vide sans mesure retenue.",
            "Mesure égale au seuil, valeurs en dessous et au-dessus du seuil.",
            "Valeurs répétées et seuil négatif. Vérifier aussi la liste après l’appel.",
        ),
        phase_questions={
            "decouverte": "Que doit renvoyer la fonction lorsque la liste est vide, et pourquoi ?",
            "recherche": "Quelle condition permet de décider si une mesure contribue à la somme ?",
            "implementation": "Comment vérifier à la main la valeur de la somme après chaque itération ?",
            "verification": "Quels tests distingueraient « supérieur » de « supérieur ou égal » ?",
            "bilan": "Que représente la somme intermédiaire après une itération de la boucle bornée ?",
        },
        function=FunctionRequirement("total_seuil", 2),
    ),
    "terminale-parcours-graphe": TrainingMission(
        title="Explorer les salles accessibles",
        level="Terminale",
        source_reference="26-NSIJ1ME1 · exercice 2, questions 9 à 11 · p. 10",
        source_url=("https://www.math93.com/images/pdf/annales_bac/Bac_NSI/"
                    "bac_NSI_2026/NSI_Epreuve_Ecrite-2026/26_NSIJ1ME1.pdf"),
        statement=(
            "Un graphe orienté est représenté par un dictionnaire dont chaque clé est "
            "une salle et chaque valeur la liste ordonnée de ses voisines accessibles en "
            "un déplacement. Toutes les salles figurent parmi les clés. Écris la fonction "
            "salles_accessibles(graphe, depart) qui renvoie la liste des salles visitées "
            "par un parcours en profondeur d’abord, dans l’ordre de la première visite "
            "et en suivant l’ordre des voisines du dictionnaire. Le départ appartient au "
            "graphe. Chaque salle doit apparaître une seule fois, même en présence d’un cycle. "
            "Le graphe reçu doit rester inchangé."
        ),
        starter_code="def salles_accessibles(graphe, depart):\n    pass\n",
        checks_to_design=(
            "Un sommet isolé, choisi comme point de départ.",
            "Un cycle et un sommet sans chemin depuis le départ.",
            "Deux branches menant au même sommet. Vérifier aussi l’ordre du parcours.",
        ),
        phase_questions={
            "decouverte": "Que représente la liste associée à un sommet dans le dictionnaire ?",
            "recherche": "Quelle information faut-il mémoriser pour éviter de suivre indéfiniment un cycle ?",
            "implementation": "Sur un graphe à deux branches, quel ordre de visite prévois-tu ?",
            "verification": "Quel petit graphe testerait à la fois un cycle et un sommet inaccessible ?",
            "bilan": "Quel parcours choisirais-tu pour minimiser le nombre de déplacements, et quelle propriété le justifie ?",
        },
        function=FunctionRequirement("salles_accessibles", 2),
    ),
}
