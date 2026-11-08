# G4-P6-F — Audit de résistance aux mutations

**Statut : EN VÉRIFICATION** — aucun test exécuté sur le poste enseignant à la date de rédaction.

## Objectif
Démontrer que les tests publics de la mission Balises lumineuses détectent des défauts ciblés dans le **code réellement saisi dans l'interface**. Une exécution sans exception n'est pas une preuve de correction.

## Mutations et cas discriminants

| Mutation | Cas public attendu en échec |
| --- | --- |
| Fusion des états identiques non consécutifs | Plages séparées |
| Oubli de la dernière plage | Une valeur |
| Modification de la liste reçue | Une valeur |
| Renvoi de listes plutôt que de tuples | Une valeur |

La dernière mutation justifie un renforcement du banc public : les éléments renvoyés doivent être des tuples de longueur deux dont l'effectif est de type `int` strictement positif. Le contrôle de non-modification de l'entrée est conservé.

Les scénarios `tests/e2e/g4-p6f-mutation-audit.spec.cjs` exercent l'éditeur, le moteur Python local et l'affichage des résultats. Le fichier `tests/pedagogie/test_balises.py` constitue un contrôle enseignant distinct ; il ne remplace pas cette recette navigateur.

## Limites
- Les quatre cas publics ne sont pas une preuve de correction universelle.
- Le code élève et les tests s'exécutent dans le même interpréteur : ce mécanisme ne résiste pas à un programme hostile qui cherche à tromper l'évaluateur.
- Une réussite ne constitue pas une certification pédagogique.
- Aucun corrigé n'est fourni dans l'interface.

## Commandes de recette
```powershell
git fetch origin
git switch --track origin/feature/g4-p6f-mutation-audit
npm.cmd --prefix frontend run build
python -m unittest discover -s tests/pedagogie -p "test_balises.py" -v
npx.cmd playwright test --config=playwright.edge.config.cjs --reporter=list --workers=1
```

**Résultat attendu : 48 tests Playwright** (44 antérieurs + 4 nouveaux), sous réserve de découverte et d'exécution. Aucun résultat n'est présumé.
