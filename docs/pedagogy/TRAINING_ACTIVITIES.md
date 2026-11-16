# Activités d’entraînement de Première et de Terminale

Les activités MicroAlbert sont des adaptations originales de compétences observées dans les annales de numérique et sciences informatiques (NSI). Chaque activité conserve le repère de sa source. Le pilote enseignant présente l’énoncé, le squelette et les cas à concevoir. Il propose une question socratique après chaque dépôt de programme.

| Niveau | Activité du pilote | Source vérifiée et adaptation |
| --- | --- | --- |
| Première | Totaliser des mesures au-dessus d’un seuil | Épreuve commune de contrôle continu (E3C), `G1SNSIN03316`, thème F, question F.6, p. 16, dans `E3C.zip/sujet-A-1.pdf`. La question demande d’interpréter une accumulation conditionnelle dans une boucle bornée. L’activité demande de programmer et tester une accumulation par seuil, avec un contexte, des données et une condition différents. [Sujet de référence](https://ccbac.fr/sujets/2020/G/2/NSIN/001/G1SNSIN03316-sujet1.pdf) |
| Terminale | Explorer les salles accessibles | Bac 2026, Métropole jour 1, `26-NSIJ1ME1`, exercice 2, questions 9 à 11, p. 10. Le sujet mobilise un parcours en profondeur et la justification du choix d’un parcours. L’activité transpose ces notions à un graphe de salles, fixe l’ordre de première visite et ajoute des tests sur un cycle. Le bilan demande un choix de parcours argumenté. [Sujet de référence](https://www.math93.com/images/pdf/annales_bac/Bac_NSI/bac_NSI_2026/NSI_Epreuve_Ecrite-2026/26_NSIJ1ME1.pdf) |

## Autonomie des exercices

Les énoncés, squelettes, questions, tentatives de démonstration et cas de test
font partie du catalogue versionné et sont disponibles dans MicroAlbert.
L’écran affiche le repère bibliographique (code, question, page). Les URL
des annales restent des références documentaires facultatives. Le site ne
charge aucun PDF, script, image ou autre ressource externe pour ces activités.
La recette navigateur valide les deux niveaux avec les requêtes externes bloquées.
Appliquer cette règle aux prochains exercices et héberger dans le dépôt les
ressources nécessaires à leur exécution.

## Sources des prochains lots

- **Première.** L’archive fournie contient 250 PDF distincts, dont 249 couvertures indiquent « Première » et portent un repère distinct. Le fichier `sujet-0.pdf` est un sujet zéro. La référence de l’archive est l’empreinte SHA-256 `e340975a399a147ac529fda7d5f29995d190dbf7eb82c608042030cd916b467e`. Ces évaluations historiques servent à repérer les notions et les raisonnements. Le cadrage du niveau s’appuie sur le programme en vigueur. [Éduscol](https://eduscol.education.gouv.fr/5823/programmes-et-ressources-en-numerique-et-sciences-informatiques-voie-g)
- **Terminale, écrit.** Rechercher le sujet auprès du ministère et, pour les copies archivées, vérifier le code imprimé, la session et les numéros d’exercice ou de question. KXS et Math93 aident à retrouver des sujets et à repérer les notions. Leurs corrigés et barèmes relèvent de leurs auteurs. Une autre piste vérifiée est `25-NSIJ1ME1`, exercice 3, questions 13 à 17, pour les arbres binaires de recherche. [DELOS](https://sujets.examens-concours.gouv.fr/delos/public/bgt/nsi) · [KXS](https://kxs.fr/sujets/terminale-ecrit) · [Math93](https://www.math93.com/index.php?option=com_content&view=article&id=1202&Itemid=1631) · [Sujet 2025](https://kxs.fr/files/sujets/2025/ecrit/terminale-2025-metropole-jour-1.pdf)
- **Terminale, pratique.** Construire des activités distinctes à partir des sujets zéro et du Bulletin officiel applicable à la session visée. Pour 2027, l’élève programme une application à partir d’un document et dialogue avec le professeur-examinateur. L’écrit comprend trois exercices indépendants. [Bulletin officiel, session 2027](https://www.education.gouv.fr/bo/2026/Special4/MENE2622643N)

Pour chaque nouvelle activité, vérifier le niveau et la notion dans le programme, indiquer le repère exact de la source et rédiger un énoncé original. Préciser les entrées, la valeur renvoyée ou l’effet observable, les préconditions et les cas limites. Préparer une tentative incomplète et un programme de structure plausible au comportement erroné. Vérifier chaque relance pour qu’elle invite l’élève à prévoir, tester ou justifier sans lui donner le corrigé.

## Parcours enseignant

1. Avec l’identité de test enseignante, récupérer les activités via `GET /api/secure/assessment/activities`.
2. Ouvrir une session via `POST /api/secure/assessment/session` avec le `mission_id` fourni par le catalogue.
3. Envoyer `mission_id`, `session_id`, `source` et `phase` à `POST /api/secure/assessment`. Réutiliser le même identifiant pour suivre les tentatives. Seuls les codes de diagnostic alimentent l’historique.
4. Lire la question posée et les éléments observés. La valeur `not_evaluated` indique qu’il reste à vérifier le comportement. Pour un cas, prévoir le résultat, justifier le choix, exécuter l’appel dans le navigateur, puis noter l’observation. Si le tuteur est activé, lui demander une relance avec ces quatre éléments.

Le pilote utilise une analyse syntaxique et structurelle de Python et des questions déterministes. Les tests automatisés couvrent les deux niveaux, la provenance, un scénario en trois tentatives, la séparation des sessions et les refus d’accès. Ils vérifient qu’une structure plausible ne suffit pas à valider le comportement. Les PDF et les corrigés de référence restent hors du dépôt et de la version publique.

## Voir les activités dans le navigateur

Dans la [démonstration GitHub Pages](https://darksathili-jpg.github.io/microalbert-lab/),
ouvre **Voir les deux exercices inspirés d’annales**, choisis le niveau, puis
compare les deux tentatives fictives. La tentative révisée présente aussi un
cas de test justifié et l’écart observé sur ce programme. Le build contrôle que ces exemples sont
générés depuis le catalogue et l’analyseur Python. Il s’agit d’une démonstration
statique. Le navigateur ne soumet aucun programme au serveur et n’appelle pas Albert.

Pour essayer l’analyse d’un programme dans l’espace **Enseignant**, démarre le
pilote de démonstration sur la machine de recette, avec des données fictives.
Depuis la racine du dépôt et après installation des dépendances :

```bash
PYTHONPATH=backend .venv/bin/python -m app.local_teacher_pilot
npm run dev --prefix frontend
```

Dans la version locale du site, ouvre **Enseignant**, copie le jeton de
démonstration du terminal dans le champ masqué de l’espace Enseignant, charge
les exercices et ouvre une session. Modifie le squelette et analyse plusieurs
tentatives. Le jeton temporaire identifie le pilote local. La clé Albert
n’est jamais demandée dans l’interface. Ce serveur écoute uniquement sur
`127.0.0.1` et utilise le port 8000. L’accès établissement et la conversation
réelle avec Albert nécessitent une recette séparée.
