# G4-INFRA-02 — Prévisualisation privée permanente

**État : PRÉPARÉ, NON ACTIVÉ. Aucun site n'est actuellement déclaré publié.**

## Fonctionnement
Le job `private-preview` dans `.github/workflows/microalbert-ci.yml` attend la réussite des deux jobs de compilation et de recette. Il ne s'exécute que sur un push vers `feature/g4-infra-01-ci` et seulement si la variable de dépôt `MICROALBERT_PRIVATE_PREVIEW_ENABLED=true`. Il construit la variante élèves `VITE_STUDENT_STAGING=true` puis envoie `frontend/dist` vers Cloudflare Pages, branche `private-preview`.

## Activation par l'administrateur Cloudflare/GitHub
1. Confirmer que l'établissement autorise Cloudflare et l'identification choisie, notamment pour les élèves.
2. Créer le projet Cloudflare Pages et configurer Cloudflare Access **avant le premier déploiement**, sur le domaine stable ET les hôtes `*.pages.dev`, les prévisualisations de branche, les alias et les ressources statiques. Une protection du seul domaine personnalisé ne suffit pas.
3. Vérifier réellement les refus anonymes sur les différents hôtes. Ne pas présumer que Pages est privé par défaut ; vérifier la couverture des URL de déploiement uniques. Si des URL ne peuvent être protégées, STOP.
4. Configurer dans GitHub l'environnement `microalbert-private-preview` avec réviseurs requis (et restrictions de branche), pour imposer l'approbation humaine du premier déploiement et des suivants tant que nécessaire.
5. Définir les secrets `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN` (permissions minimales Pages uniquement). Définir les variables `CLOUDFLARE_PAGES_PROJECT`, `MICROALBERT_ACCESS_ALL_HOSTNAMES_VERIFIED=true` uniquement **après** contrôle de protection réel.
6. Enfin seulement définir `MICROALBERT_PRIVATE_PREVIEW_ENABLED=true`. Le prochain push sur la branche déclenchera une publication après réussite des tests et approbation de l'environnement.
7. Vérifier en navigation anonyme refus d'accès sur page, JS, Worker, Pyodide, domaine personnalisé, domaine Pages, URL de branche et URL de déploiement. Vérifier accès autorisé et révocation. Conserver un rapport d'essai.

## Limites
- Le job conditionnel ne crée ni ne vérifie lui-même les politiques Cloudflare Access : la variable `MICROALBERT_ACCESS_ALL_HOSTNAMES_VERIFIED` est une **attestation humaine**, pas une preuve de sécurité automatique.
- La branche `private-preview` peut produire une URL distincte du domaine stable. La stabilité de l'adresse est à configurer côté Cloudflare.
- Le frontend est statique : pas de backend Albert réel ni d'API Audit sur Pages.
- Masquer les modes Enseignant/Audit à l'interface ne garantit pas l'absence de leur contenu dans le bundle JavaScript. Auditer le bundle avant tout partage.
- La protection de Cloudflare Access, la conformité et les permissions GitHub doivent être vérifiées avant activation.
- Aucune URL, aucun identifiant, aucun jeton ni aucune liste d'élèves ne doit être ajouté au dépôt.

## Critère de sortie
Une URL stable réellement protégée, un déploiement réussi, un refus anonyme vérifié, un accès autorisé vérifié et une révocation testée. Tant que ces preuves manquent : **EN ATTENTE DE CONFIGURATION EXTERNE**.
