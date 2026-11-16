"""Modules pédagogiques d'Atelier Python, chargés au démarrage du navigateur."""
import builtins
import csv
import json
import math
import os
import sqlite3
import sys
import types
from pathlib import Path

from js import atelier_ask, atelier_event
from pyodide.ffi import run_sync

racine = Path("/home/atelier")
racine.mkdir(parents=True, exist_ok=True)
os.chdir(racine)


def envoyer(type_evenement, **options):
    atelier_event(json.dumps({"type": type_evenement, **options}, ensure_ascii=False))


class Tortue:
    def __init__(self):
        self.x = self.y = self.angle = 0.0
        self.trace = True
        self.trait = "#2856dd"
        self.remplissage = "#82a5ff"
        self.points = None

    def goto(self, x, y):
        x, y = float(x), float(y)
        if not math.isfinite(x) or not math.isfinite(y):
            raise ValueError("Les coordonnées doivent être finies.")
        if self.trace:
            envoyer("trait", x1=self.x, y1=self.y, x2=x, y2=y, couleur=self.trait)
        self.x, self.y = x, y
        if self.points is not None and len(self.points) < 1200:
            self.points.append([x, y])

    def forward(self, distance):
        angle = math.radians(self.angle)
        self.goto(self.x + distance * math.cos(angle), self.y + distance * math.sin(angle))

    def backward(self, distance):
        self.forward(-distance)

    def left(self, angle):
        self.angle = (self.angle + angle) % 360

    def right(self, angle):
        self.left(-angle)

    def setheading(self, angle):
        self.angle = angle % 360

    def penup(self):
        self.trace = False

    def pendown(self):
        self.trace = True

    def color(self, couleur, remplissage=None):
        self.trait = str(couleur)
        self.remplissage = self.trait if remplissage is None else str(remplissage)

    def fillcolor(self, couleur):
        self.remplissage = str(couleur)

    def begin_fill(self):
        self.points = [[self.x, self.y]]

    def end_fill(self):
        if self.points:
            envoyer("polygone", points=self.points, couleur=self.remplissage)
        self.points = None

    def circle(self, rayon):
        if rayon == 0:
            return
        angle = math.radians(self.angle)
        cx = self.x - rayon * math.sin(angle)
        cy = self.y + rayon * math.cos(angle)
        for pas in range(1, 73):
            theta = angle + math.copysign(2 * math.pi * pas / 72, rayon)
            self.goto(cx + rayon * math.sin(theta), cy - rayon * math.cos(theta))


_tortue = Tortue()
tortue = types.ModuleType("tortue")
for nom in ("forward", "backward", "left", "right", "goto", "setheading",
            "penup", "pendown", "color", "fillcolor", "begin_fill", "end_fill", "circle"):
    setattr(tortue, nom, getattr(_tortue, nom))
sys.modules["tortue"] = tortue

actions = {}


def interface(champs, boutons, *, titre=""):
    if len(champs) > 20 or len(boutons) > 20:
        raise ValueError("L’aperçu accepte jusqu’à 20 champs et 20 boutons.")
    actions.clear()
    actions.update(boutons)
    controles = [
        {"cle": str(cle), "label": str(spec) if isinstance(spec, str) else str(cle).capitalize(),
         "choix": None if isinstance(spec, str) else [str(x) for x in spec][:40]}
        for cle, spec in champs.items()
    ]
    envoyer("interface", champs=controles, boutons=list(actions), titre=str(titre))


def afficher(texte):
    envoyer("afficher", texte=str(texte)[:10000])


def fond(couleur):
    envoyer("fond", couleur=str(couleur))


def effacer(cle=None):
    envoyer("effacer", cle=cle)


def image(numero):
    if numero not in (1, 2, 3):
        raise ValueError("Choisis une image entre 1 et 3.")
    envoyer("image", numero=numero)


atelier = types.ModuleType("atelier")
for nom in ("interface", "afficher", "fond", "effacer", "image"):
    setattr(atelier, nom, globals()[nom])
sys.modules["atelier"] = atelier


class SaisiesEpuisees(EOFError):
    pass


def environnement(lignes, *, silencieux=False, interactif=False):
    valeurs = iter(lignes)

    def lire(message=""):
        if message and not silencieux:
            print(message, end="", flush=True)
        try:
            valeur = next(valeurs)
        except StopIteration:
            if not interactif:
                raise SaisiesEpuisees("Ajoute une ligne par appel à input() dans « Saisies pour input() », puis relance.") from None
            valeur = str(run_sync(atelier_ask(message or "Saisis une valeur.")))
        if not silencieux:
            print(valeur)
        return valeur

    fonctions = dict(vars(builtins))
    fonctions["input"] = lire
    return {"__builtins__": fonctions, "__name__": "__main__"}


def executer(code, lignes, interactif=False):
    actions.clear()
    _tortue.__init__()
    os.chdir(racine)
    exec(compile(code, "<ton programme>", "exec"), environnement(lignes, interactif=interactif))


def cliquer(nom, champs):
    actions[nom](champs)


def verifier(code, tests):
    from contextlib import redirect_stdout, redirect_stderr
    from io import StringIO

    programme = compile(code, "<ton programme>", "exec")
    resultats = []
    for cas in tests:
        sortie = StringIO()
        with redirect_stdout(sortie), redirect_stderr(sortie):
            exec(programme, environnement(cas["entrees"], silencieux=True))
        obtenu = sortie.getvalue().strip()
        attendu = cas["sortie"].strip()
        resultats.append({"entrees": cas["entrees"], "attendu": attendu,
                          "obtenu": obtenu[:650], "ok": obtenu == attendu})
    return json.dumps(resultats, ensure_ascii=False)


LIVRES = [
    ("Le jardin lunaire", "Nora Valin", 2018),
    ("Les ombres du port", "Milo Ravel", 2012),
    ("Deux rives, un pont", "Nora Valin", 2021),
    ("L’atelier des vents", "Aïcha Solan", 2012),
    ("Le dernier méridien", "Milo Ravel", 2024),
]


def preparer_prenoms():
    fichier = Path("prenoms.txt")
    if not fichier.exists():
        fichier.write_text("Lina\nNoé\nSacha\nCamille\nÉden\n", encoding="utf-8")


def preparer_livres():
    fichier = Path("livres.csv")
    if not fichier.exists():
        with fichier.open("w", encoding="utf-8", newline="") as flux:
            csv.writer(flux).writerows([("titre", "auteur", "annee"), *LIVRES])


def preparer_bibliotheque():
    with sqlite3.connect("bibliotheque.db") as base:
        base.execute("PRAGMA foreign_keys = ON")
        base.execute("CREATE TABLE IF NOT EXISTS auteurs (id INTEGER PRIMARY KEY, nom TEXT, ville TEXT)")
        base.execute("CREATE TABLE IF NOT EXISTS livres (id INTEGER PRIMARY KEY, titre TEXT, annee INTEGER, auteur_id INTEGER REFERENCES auteurs(id))")
        base.executemany("INSERT OR IGNORE INTO auteurs VALUES (?, ?, ?)",
                         [(1, "Nora Valin", "Lille"), (2, "Milo Ravel", "Lyon"), (3, "Aïcha Solan", "Lille")])
        id_auteurs = {"Nora Valin": 1, "Milo Ravel": 2, "Aïcha Solan": 3}
        base.executemany("INSERT OR IGNORE INTO livres VALUES (?, ?, ?, ?)",
                         [(i, titre, annee, id_auteurs[auteur]) for i, (titre, auteur, annee) in enumerate(LIVRES, 1)])
    base.close()


donnees = types.ModuleType("donnees")
for nom in ("LIVRES", "preparer_prenoms", "preparer_livres", "preparer_bibliotheque"):
    setattr(donnees, nom, globals()[nom])
sys.modules["donnees"] = donnees
