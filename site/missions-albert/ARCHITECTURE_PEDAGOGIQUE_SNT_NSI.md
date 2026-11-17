# Architecture pédagogique — MicroAlbert Lab
Version de cadrage : 17 novembre 2026

## Références officielles
- SNT en vigueur (BO spécial n°1, 22 janvier 2019) : https://eduscol.education.gouv.fr/5841/programmes-et-ressources-en-sciences-numeriques-et-technologie-voie-gt
- NSI Première et Terminale : https://eduscol.education.gouv.fr/5823/programmes-et-ressources-en-numerique-et-sciences-informatiques-voie-g
- Révision SNT / IA annoncée pour 2027 : https://www.education.gouv.fr/le-conseil-superieur-des-programmes/revision-du-programme-de-sciences-numeriques-et-technologie-snt-de-seconde-505738

## Règle fondamentale
Séparer : (1) progression pédagogique, (2) énoncés et aides, (3) exécution Python Pyodide, (4) validation par tests, (5) visualisation Albert, (6) IA tutorale facultative. Une seule branche de livraison, aucun service payant obligatoire.

## Référentiel de compétences
A — Séquences, instructions, débogage et traces.
B — Affectations, variables et types (entier, flottant, booléen, chaîne).
C — Conditions if/elif/else, comparaisons, opérateurs booléens.
D — Boucles bornées for/range, boucles non bornées while, terminaison, compteurs, accumulateurs.
E — Fonctions def, paramètres, return, différence entre afficher et renvoyer, décomposition.
F — Chaînes, indices, tranches, listes, parcours, recherche, appartenance, construction.
G — Algorithmes : recherche séquentielle, maximum, comptage, tests de cas limites.
H — Projets SNT contextualisés dans les sept thèmes officiels : Internet, Web, réseaux sociaux, données structurées, localisation/cartographie/mobilité, informatique embarquée/objets connectés, photographie numérique.
I — Préparation Première NSI : représentations des données, tableaux, dictionnaires, tuples, algorithmes, spécification et tests, notions de machines/réseaux/web (modules distincts de Python).

## Contrat d'une mission
- id stable, niveau, compétence officielle visée, prérequis, contexte SNT, objectif observable
- consigne claire sans solution, programme de départ facultatif, exemples de prédiction
- tests publics + tests de cas limites ; plusieurs jeux de données si applicable
- critères de réussite indépendants de la seule sortie sans erreur
- indice 1 (question), indice 2 (méthode), indice 3 (diagnostic), sans solution
- retour sur erreur (syntaxe, logique, terminaison, type) et piste de remédiation
- preuve de maîtrise : exercice analogue sans aide, puis réinvestissement

## Évaluation
États : non commencé, en cours, exécuté, tests réussis, compétence confirmée.
Ne jamais déduire « compétence confirmée » d'une simple exécution.
Les tests doivent être déterministes et indépendants de l'ordre de lancement.
Pour les activités de prédiction, recueillir une prédiction avant exécution.
Pour les fonctions, tester plusieurs entrées et cas limites sans révéler tous les tests.
Conserver les traces de progression localement sans données personnelles.

## Architecture technique cible
- `missions-albert/index.html` : environnement animé et défis spatiaux
- `missions-albert/python-reel.html` : éditeur et console Pyodide
- `missions-albert/python-worker.js` : exécution isolée, interruption par terminaison du Worker
- `missions-albert/curriculum/` : référentiel de compétences et missions structurées
- `missions-albert/evaluation/` : validations automatiques et diagnostics
- `missions-albert/assets/` : sprite sheet et puce BD haute définition
- IA Albert : accès serveur facultatif uniquement, jamais de clé dans GitHub Pages
- Publication : GitHub Pages, vérification de la révision réellement déployée et tests navigateur

## Séquence de réalisation sans dispersion
P0 — Stabiliser les 20 missions animées et les 18 activités Python, avec tests exécutés.
P1 — Ajouter les critères de réussite automatiques et le suivi de maîtrise.
P2 — Compléter les données, fonctions, listes et algorithmes par niveaux.
P3 — Contextualiser sept mini-projets SNT.
P4 — Ajouter passerelle Première NSI, exercices de transfert et évaluation finale.
P5 — Ajouter tutorat IA Albert facultatif, sans exposer les clés.
Chaque étape : implémentation, tests, audit visuel, déploiement, vérification de version ; aucune création de branche supplémentaire.

## Vigilances
Le programme SNT 2027 est en révision : ne pas présenter une proposition comme un texte en vigueur.
Le moteur simplifié des déplacements n'est pas Python complet.
Un programme qui s'exécute n'est pas forcément correct.
Ne pas détruire les 150 défis et les autres pages du site.
