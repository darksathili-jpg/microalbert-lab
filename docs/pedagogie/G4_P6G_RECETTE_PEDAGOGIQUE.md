# G4-P6-G — Séparation des espaces et recette pédagogique

**État : EN VÉRIFICATION.** Aucun test local ni séance en classe n'est déclaré validé.

## Anomalie corrigée
Le composant `mock-controls` était rendu après les trois branches conditionnelles des espaces Élève, Enseignant et Audit. Le bouton « Interroger le simulateur » apparaissait donc dans chaque espace. Il est maintenant réservé à Audit. Aucun appel réel à Albert n'est activé.

## Contrat de rôles
- **Élève** : missions, éditeur Python, tests et questions du tuteur ; pas de commande technique du fournisseur simulé.
- **Enseignant** : activité de référence et repères didactiques ; pas de commande technique du fournisseur simulé.
- **Audit** : contrat de réponse simulé, modèle `microalbert-mock`, requête et métadonnées techniques.

## Recette automatisée
Le fichier `tests/e2e/g2-r6-app.spec.cjs` vérifie désormais la visibilité du simulateur uniquement en Audit, l'absence de fuite de réponse vers les autres espaces et la compatibilité des thèmes.

Exécuter :
```powershell
git fetch origin
git switch --track origin/feature/g4-p6g-pedagogical-roles
npm.cmd --prefix frontend run build
npx.cmd playwright test --config=playwright.edge.config.cjs --reporter=list --workers=1
```
Le nombre attendu reste **48 tests** : adaptation de scénarios existants, sans ajout de nouveau scénario.

## Protocole pédagogique manuel (non encore réalisé)
1. **Élève — diagnostic** : fournir une fonction Balises qui fusionne des plages séparées. Demander une prédiction avant l'exécution ; observer si l'élève interprète l'écart.
2. **Élève — remédiation** : laisser l'élève modifier son code sans donner de solution ; noter si l'indice utilisé aide à identifier le changement de plage.
3. **Élève — transfert** : proposer un cas nouveau `['ON','OFF','OFF','ON']` et demander une justification écrite de la sortie attendue.
4. **Enseignant** : examiner les traces de raisonnement recueillies manuellement, sans prétendre qu'elles sont sauvegardées par l'application.
5. **Audit** : vérifier le fournisseur simulé et l'absence de toute commande d'interrogation technique dans les deux autres espaces.

## Grille d'observation
Pour chacun des critères suivants, relever **0 : non démontré**, **1 : partiel**, **2 : autonome et justifié** :
- Prévoit un résultat avant d'exécuter.
- Identifie la différence entre plages consécutives et valeurs identiques dispersées.
- Explique un écart à partir d'un cas limite.
- Corrige son programme et vérifie la non-modification de l'entrée.
- Justifie un résultat sur un cas non utilisé dans les quatre tests publics.

La grille n'est **pas** un score calculé par l'application ; aucune certification automatique n'est autorisée.

## Porte de validation
- Recette technique : compilation et 48 tests Playwright réussis.
- Recette pédagogique : observations de classe ou simulation encadrée, preuves datées et analysées.
- Aucune fusion dans `main`, aucun déploiement sans autorisation distincte.
