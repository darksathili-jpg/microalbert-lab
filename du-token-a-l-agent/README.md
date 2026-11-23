# MicroAlbert — Du token à l’agent IA

Parcours en huit laboratoires à partir du cahier pédagogique v1.0 du 23 novembre 2026 et des deux images de référence. Application React, TypeScript et Vite. Le tutorat utilise des scénarios locaux. Python s’exécute dans un Worker avec le runtime Pyodide fourni par le site statique.

## Vérifier et démarrer

Avec Node.js 24 et npm :

```sh
npm ci
npm test
npx playwright install chromium
npm run test:e2e
npm run dev
```

Pour utiliser un Chromium déjà installé, définir CHROMIUM_PATH pour la commande de tests navigateur. Les captures sont écrites dans verification/. Le build de production se génère avec npm run build et peut être vérifié avec npm run preview.

## GitHub Pages

Le parcours est publié sous `/microalbert-lab/du-token-a-l-agent/` par le workflow `microalbert-pages.yml` de la branche `feature/g4-github-pages-preview`. Ce workflow référence un commit de `feature/du-token-a-l-agent`, vérifie les deux applications et ajoute le build de ce parcours dans un sous-répertoire de l’artefact Pages. Pour publier une nouvelle version, mettre à jour la révision du parcours dans le workflow. Les chemins relatifs et les fragments d’URL permettent une navigation directe entre laboratoires. Aucun secret de fournisseur LLM n’est requis.

La progression (version 1, séances validées, dernière séance) reste dans le stockage local du navigateur. Le tableau de bord permet de la sauvegarder et de la restaurer en JSON. Le code Python et les essais restent en mémoire dans l’atelier.
