# G4-P6-E — Recette des tests fonctionnels publics

**État : EN VÉRIFICATION.** Branche indépendante, sans fusion ni publication.

## Périmètre
- Quatre cas publics exécutés sur la fonction `regrouper(etats)` saisie par l'élève : liste vide, singleton, alternance et plage de 256.
- Comparaison stricte des résultats attendus et vérification que la liste reçue n'a pas été modifiée.
- En cas d'écart : résultat observé et question de diagnostic, sans solution.
- Une exécution réussie et quatre comparaisons conformes **ne constituent pas** une validation générale ou certificative.
- Les cas publics sont connus de l'élève : une fonction spécialisée pourrait les réussir sans respecter la spécification. Les tests enseignants restent indépendants.

## Limites
- Le code est exécuté dans Pyodide, dans un Web Worker ; ce n'est pas un bac à sable pour du code hostile.
- Les sorties sont plafonnées à 16 000 caractères ; un programme très bavard peut masquer le rapport de tests.
- L'élève peut écrire des instructions de haut niveau qui modifient le comportement du banc de test. Aucun résultat ne doit être considéré comme une preuve de sécurité ou d'intégrité.
- Aucune requête réelle à Albert API, aucune sauvegarde des travaux.

## Recette locale
```powershell
git fetch origin
git switch --track origin/feature/g4-p6e-functional-checks
npm.cmd --prefix frontend run build
python -m unittest discover -s tests/pedagogie -p "test_balises.py" -v
npx.cmd playwright test --config=playwright.edge.config.cjs --reporter=list --workers=1
```

## Recette manuelle
1. Sélectionner Balises lumineuses ; saisir `def regrouper(etats):\n    return []`.
2. Ouvrir Mes tests et exécuter les cas : liste vide conforme, autres cas en écart.
3. Vérifier l'absence de mention « mission validée » et de corrigé.
4. Tester `raise ValueError("essai")` dans la fonction : quatre écarts, sans certification.
5. Vérifier les thèmes clair, sombre et vidéoprojecteur et l'affichage mobile.

**Attendu : 44 tests Playwright** si les 42 tests précédents et les deux nouveaux sont découverts. Aucun succès n'est présumé avant exécution.
