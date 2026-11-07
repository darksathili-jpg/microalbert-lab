# G4-P1 — Référentiel pédagogique NSI, session 2026

**Statut : SPÉCIFIÉ — audit documentaire initial ; aucune intégration élève validée.**

## Sources institutionnelles (consultées le 7 novembre 2026)

1. Éduscol STI — épreuve pratique 2026 : https://sti.eduscol.education.fr/concours_examens/epreuve-pratique-bac-specialite-numerique-et-sciences-informatiques-2026 (dossier de 23 sujets).
2. Éduscol STI — spécialité NSI, sujets écrits 2026 et textes de référence : https://sti.eduscol.education.fr/formations/bac-voie-generale/specialite-nsi-numerique-et-sciences-informatiques
3. Éduscol — programmes et ressources de Première et Terminale : https://eduscol.education.gouv.fr/5823/programmes-et-ressources-en-numerique-et-sciences-informatiques-voie-g?menu_id=2536
4. Académie de Normandie — index de 12 sujets écrits 2026 et thèmes des exercices : https://nsi-snt.ac-normandie.fr/sujets-du-baccalaureat-2026-terminale-nsi

**Prudence** : l'index académique est une aide à la navigation, pas une correction officielle. La publication de sujets par l'institution ne constitue pas une validation de MicroAlbert Lab par l'inspection.

## Matrice de correspondance initiale

| Référence | Notions constatées dans l'index des sujets | Activité MicroAlbert originale envisagée | Preuve élève attendue |
|---|---|---|---|
| Métropole juin J1 26-NSIJ1ME1 | Routage et sécurisation ; binaire, graphes, récursivité ; arbres et bases de données | Expliquer une table de routage, vérifier un parcours de graphe, écrire une requête | Trace de raisonnement, tests et justification |
| Métropole juin J2 26-NSIJ2ME1 | Réseaux et programmation orientée objet ; mise au point et graphes ; bases de données, files, graphes | Diagnostiquer une fonction Python erronée et proposer un test qui échoue avant correction | Code corrigé, résultat avant/après |
| Asie juin J1 26-NSIJ1JA1 | Bases de données ; programmation et algorithmique ; routage RIP | Produire et contrôler une requête SQL ; simuler un calcul de route | Requête et justification |
| Asie juin J2 26-NSIJ2JA1 | Structures linéaires et programmation orientée objet ; bases de données et graphes ; routage et files | Écrire une implémentation de file et tester une propriété FIFO | Code, appels de fonctions, valeurs renvoyées |
| Antilles-Guyane juin J2 26-NSIJ2AG1 | Bases de données ; graphes et routage ; tableaux, dictionnaires, récursivité, programmation dynamique | Construire un algorithme récursif puis confronter sa réponse à une proposition d'IA | Cas de base, terminaison, jeux de tests |
| Banque pratique 2026 | 23 sujets officiels | Sélection raisonnée après lecture individuelle des sujets et de leurs fichiers | Grille source → compétence → exercice → test |

Cette matrice est **une présélection**, non une validation sujet par sujet. Les énoncés complets et les fichiers associés à chaque sujet pratique devront être examinés avant toute adaptation.

## Contrat pédagogique G4

- **Production initiale par l'élève** : l'élève écrit d'abord un algorithme, une fonction Python ou une justification.
- **Aide graduée** : indice conceptuel, indice de structure, puis exemple analogue ; aucune solution complète affichée avant une tentative.
- **Vérification indépendante** : tests déterministes, cas limites, valeurs renvoyées, traces d'exécution.
- **Regard critique sur l'IA** : une réponse du modèle peut être inexacte ; l'élève doit identifier et prouver les erreurs.
- **Vocabulaire conforme aux programmes** : « variable de type entier », « affecter une valeur à une variable », « boucle bornée », « instruction », « valeur renvoyée ».
- **Modes d'affichage** : clair, sombre et vidéoprojecteur ; aucune zone sombre persistante en mode vidéoprojecteur.
- **Autonomie** : objectifs, prérequis, consignes, exemples d'appel, tests, autoévaluation et trace de réussite.
- **Traçabilité** : conserver l'identifiant du sujet officiel et la référence du programme sans présenter l'adaptation comme « approuvée par l'inspection ».

## Propositions de missions originales (non issues d'une reproduction littérale)

**M01 — File de messages** (Terminale ; structure de données abstraite de type file) :
implémenter `enfiler(file, valeur)` et `defiler(file)`, écrire des appels, vérifier les valeurs renvoyées et la propriété « premier entré, premier sorti ». Une réponse d'IA présentant une pile comme une file doit être réfutée par un contre-exemple.

**M02 — Parcours de graphe** (Terminale ; graphes, parcours) :
écrire une fonction de parcours en largeur sur un petit graphe fourni, afficher les étapes de la file et tester le cas d'un sommet isolé. Distinguer les tests de programme de la justification algorithmique.

**M03 — Requête SQL** (Terminale ; bases de données relationnelles) :
à partir d'un schéma fictif de bibliothèque, écrire une requête avec jointure, expliquer le rôle des clés et contrôler le résultat sur un jeu de données fourni.

**M04 — Correction argumentée** (Première/Terminale ; mise au point) :
recevoir une fonction volontairement incorrecte, proposer un test révélateur, corriger le code puis documenter les résultats avant/après.

## Porte de validation avant développement

1. Lire et inventorier **individuellement les 23 sujets pratiques** et les sujets écrits retenus, avec leurs documents annexes.
2. Vérifier le niveau Première/Terminale et les attendus précis du programme pour chaque activité.
3. Faire auditer le vocabulaire, les exemples, les jeux de tests et les solutions par un second regard.
4. Vérifier les droits de réutilisation ; privilégier les liens officiels et des exercices originaux plutôt que la copie des énoncés.
5. Ne pas assimiler publication institutionnelle et approbation de l'outil par l'inspection.
6. Garder G3 bloqué pour tout trafic réel vers Albert API, sans fusion dans `main` ni publication.

**Décision : G4-P1 documentaire en cours.** Aucun parcours élève n'est déclaré validé ou publié.
