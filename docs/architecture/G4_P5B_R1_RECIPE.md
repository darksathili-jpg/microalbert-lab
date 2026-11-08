# G4-P5-B-R1 — Recette de fiabilisation

**Statut : EN VÉRIFICATION.** Aucun test R1 exécuté par l'assistant. Quatre tests G4-P5-B initiaux déclarés réussis par l'utilisateur.

## Prérequis
- Branche `feature/g4-p5b-isolated-python-runtime`, environnement local fonctionnel.
- Vite sur `http://127.0.0.1:5173/`, configuration Playwright Edge existante.
- `npm.cmd --prefix frontend run build` réussi et fichier de verrouillage NPM contrôlé.

## Commandes
```powershell
git status -sb
git pull --ff-only
npm.cmd --prefix frontend run build
npx.cmd playwright test g4-p5b-r1-regression.spec.cjs --config=playwright.edge.config.cjs --reporter=list --workers=1
npx.cmd playwright test g4-p5b-python-runtime.spec.cjs g4-p5a-python-editor.spec.cjs g2-r6-app.spec.cjs --config=playwright.edge.config.cjs --reporter=list --workers=1
```

## Recette manuelle
1. Modes clair, sombre, vidéoprojecteur : lisibilité de l'éditeur, du bouton d'exécution, de l'état et des erreurs.
2. Navigation clavier et focus ; mobile et zoom 200 %.
3. Outils de développement > Réseau : vérifier les ressources locales Pyodide, sans CDN ni Albert API, pendant un programme simple.
4. Outils de développement > Console : aucune erreur non expliquée.
5. Enregistrer les preuves et anomalies ; ne pas déclarer de réussite sans rapport réel.

## Limites de sécurité
Le test de requêtes observe un scénario simple uniquement. Il ne prouve pas que du code Python arbitraire ne peut pas émettre de requêtes réseau. Le Worker n'est pas un confinement sécurisé, et la mémoire n'est pas plafonnée. La solution reste non qualifiée pour l'exécution de code hostile. Une politique réseau/CSP dédiée et une revue de sécurité sont nécessaires avant publication institutionnelle.

## Critère de décision
Si build ou tests échouent, **BLOQUÉ**. Sinon, R1 peut être validé fonctionnellement dans son périmètre, mais la qualification de sécurité reste ouverte. Aucune fusion ni publication.
