# G4-P6-C — Revue documentaire ciblée et recette de validation

Date : 2026-11-08. Statut : EN VÉRIFICATION.

## Source primaire contrôlée
Page officielle : https://sti.eduscol.education.fr/concours_examens/epreuve-pratique-bac-specialite-numerique-et-sciences-informatiques-2026

La page indique explicitement : publication le 30 juin 2026, dossier de **23 sujets**, épreuve de programmation sur ordinateur à partir d'un document remis au candidat. Elle classe les compétences sous les rubriques C2 (structures de données), C3 (bases de données), C4 (architectures, systèmes, réseaux), C5 (langages et programmation) et C6 (algorithmique). Elle référence également les sujets écrits 2026 par centre et jour.

Archive ZIP officielle indiquée sur la page :
https://sti.eduscol.education.fr/sites/eduscol.education.fr.sti/files/concours-examens/19321/19321-23-sujets-epreuve-pratique-nsi-2026.zip

**Limite constatée** : la tentative de récupération de cette archive a retourné une erreur HTTP 503. Aucun fichier interne de l'archive n'a été inspecté dans cette revue. Il serait donc injustifié d'affirmer que la mission « Balises lumineuses » reprend une question précise du sujet 1 officiel. La référence à la fiche de l'enseignant demeure une inspiration pédagogique, non une preuve de correspondance textuelle.

## Conséquences pour le laboratoire
- Garder l'énoncé « Balises lumineuses » original.
- Ne pas ajouter de numéro de sujet officiel ni de compétence attribuée à une question sans lecture du document source.
- Séparer trois niveaux de preuve : (a) la présence d'une fonction dans le code, (b) une exécution Python sans exception, (c) la conformité de ses résultats à des tests.
- La préparation des tests est une **autoévaluation formative** : elle ne compare pas automatiquement la sortie réelle du programme au résultat attendu.
- Les tests Python de référence dans `tests/pedagogie` ne testent pas directement le code écrit par l'élève.

## Protocole local demandé
1. `npm.cmd --prefix frontend run build`
2. `python -m unittest discover -s tests/pedagogie -p "test_balises.py" -v`
3. `npx.cmd playwright test --config=playwright.edge.config.cjs --reporter=list --workers=1`
4. Recette manuelle : saisir une fonction erronée qui renvoie systématiquement `[]` ; vérifier que l'exécution réussit sans que le tuteur affirme que l'algorithme est correct.
5. Recette manuelle : vérifier que la comparaison attendue ne se dévoile qu'après la prédiction, et qu'aucun corrigé de fonction n'est fourni.

## Décision
Ne pas fusionner dans `main`, ne pas publier. Les contrôles locaux et la lecture détaillée des sujets officiels restent nécessaires.
