# Rapport de recette G0 — Guide enseignant

Date : 2026-11-06. Branche : `docs/g0-architecture-orchestration`.
**Décision : EN VÉRIFICATION — revue humaine visuelle encore nécessaire.**

## Résultats constatés
- GitHub Actions « G0 teacher guide checks » : succès, exécution 42258890482.
- GitHub Actions « G0 teacher guide browser » : succès, exécution 42258890616.
- Playwright Chromium : **14/14 tests réussis**, durée 4,5 s selon journal du job 128033306842.
- 9 captures : clair, sombre et vidéoprojecteur × 1536×1024, 1366×768, 390×844.
- Artefact `microalbert-g0-guide-evidence` : ID 13524685407, 2 745 825 octets, SHA-256 d'archive annoncé par GitHub `e4e8b68d3a32b5f6242c30ca4b0f12f0f3aa11fc288511387079eef09e622362`. Expiration annoncée 2026-11-20.
- Lien : https://github.com/darksathili-jpg/microalbert-lab/actions/runs/42258890616

## Incident résolu
Le premier workflow Chromium a échoué avant les tests : Playwright 1.56.1 n'installait pas Chromium sur le runner Ubuntu 26.04. Correctif : conteneur `mcr.microsoft.com/playwright:v1.56.1-noble` (commit `1e5ef7c`). Les tests ont ensuite réellement démarré et réussi.

## Portée de la preuve
Les tests démontrent le comportement testé, et non l'absence générale de défaut. La vérification automatique des fonds en mode projecteur ne remplace pas l'inspection des captures. Le guide ne prouve pas que le prototype V0.1 ni la future application React fonctionnent. Les liens officiels, le parcours réel de configuration de la clé et la lecture pédagogique doivent encore être vérifiés.

## Décisions
- Guide autonome : **recette automatique réussie**.
- Revue artistique et pédagogique : **ATTENTE_HUMAINE**.
- G0 global : **EN VÉRIFICATION**.
- G1 : **NON AUTORISÉ** sans validation explicite.
- Fusion dans `main` : **NON AUTORISÉE**.

## Contrôle humain demandé
Télécharger l'artefact depuis l'exécution GitHub Actions et inspecter les 9 images, particulièrement l'absence de surfaces sombres en mode projecteur, la hiérarchie visuelle et la lisibilité des tableaux sur mobile. Signaler les anomalies avant décision.
