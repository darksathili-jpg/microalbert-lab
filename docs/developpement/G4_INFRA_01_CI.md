# G4-INFRA-01 — Automatisation des vérifications

**Statut : EN VÉRIFICATION.** Ce lot ne publie pas le site, ne fusionne pas dans `main` et ne déploie rien sur Cloudflare.

Le workflow `.github/workflows/microalbert-ci.yml` automatise deux tâches indépendantes :

1. **Build standard** : `npm ci --prefix frontend`, `npm run build --prefix frontend`, puis contrôle des artefacts.
2. **Build pilote élèves** : mêmes contrôles avec `VITE_STUDENT_STAGING=true`, installation du testeur et de Chromium, puis test Playwright de l'interface élèves sur serveur Vite isolé.

Le projet contient un `frontend/package-lock.json` mais **pas encore de `package-lock.json` racine**. La CI utilise donc temporairement `npm install --no-save --no-package-lock` à la racine pour Playwright. Cette solution permet un premier diagnostic automatique, **mais ne verrouille pas les dépendances de test de manière satisfaisante**. Le verrouillage racine et la suite de régression complète restent à réaliser.

## Conditions pour déclarer G4-INFRA-01 validé
- [ ] Le workflow apparaît et démarre sur la branche `feature/g4-infra-01-ci`.
- [ ] Les deux jobs passent sur un commit identifié.
- [ ] Les journaux prouvent l'exécution réelle de TypeScript, Vite, Pyodide et Playwright.
- [ ] La suite complète de non-régression (référence : 48 tests) est intégrée et réussit.
- [ ] Les dépendances de test sont verrouillées dans un lockfile racine commité.
- [ ] Un échec intentionnel de test provoque effectivement l'échec du workflow (test de mutation de la chaîne).
- [ ] La protection de branche est configurée si les droits du dépôt le permettent ; la présence d'une CI seule ne bloque pas les fusions.
- [ ] La recette pédagogique et la sécurité Cloudflare restent séparées.

**Ne pas demander à l'enseignant de lancer des scripts locaux pour diagnostiquer les erreurs de compilation.** Analyser les logs Actions en priorité. Si les permissions GitHub ne permettent pas de lire les runs, signaler explicitement la limite.

## Exclusions
Pas de validation pédagogique automatique ; pas de garantie de sécurité des programmes Python exécutés dans un Web Worker ; pas de publication, de secrets ou de comptes élèves.
