# G4-P6-A — Retour pédagogique après exécution

**Statut : EN VÉRIFICATION — aucun test exécuté par l'assistant.**

## Périmètre
- Règles déterministes et hors ligne dans `frontend/src/pedagogicalFeedback.ts`.
- Après chaque exécution : catégorie, question socratique, action de vérification.
- Catégories : succès technique, erreurs de syntaxe/indentation, nom inconnu, indice hors limites, types incompatibles, division par zéro, autres exceptions, interruption et erreur moteur.
- Aucun jugement automatique sur la correction de la mission, aucun corrigé, aucune requête Albert.
- Les cinq étapes pédagogiques et le budget de trois indices restent inchangés.

## Limites
Une exécution sans exception ne prouve pas qu'une fonction est correcte. Les messages sont classés par motifs textuels dans les exceptions Python ; ils peuvent être incomplets. Une modification du code sans nouvelle exécution laisse le dernier retour visible : il décrit l'exécution précédente et non nécessairement le code actuel. Un affichage de feedback ne constitue pas une validation de l'élève.

## Recette locale
```powershell
git status -sb
git fetch origin
git switch --track origin/feature/g4-p6a-pedagogical-feedback
npm.cmd --prefix frontend run build
npm.cmd --prefix frontend run dev -- --strictPort
```
Dans un second terminal, avec la configuration Edge existante :
```powershell
npx.cmd playwright test g4-p6a-pedagogical-feedback.spec.cjs --config=playwright.edge.config.cjs --reporter=list --workers=1
npx.cmd playwright test g4-p5b-python-runtime.spec.cjs g4-p5b-r1-regression.spec.cjs g4-p5a-python-editor.spec.cjs g2-r6-app.spec.cjs --config=playwright.edge.config.cjs --reporter=list --workers=1
```
Si le port 5173 est occupé, conserver le serveur Vite existant seulement s'il sert bien la nouvelle branche, sinon arrêter proprement l'ancien serveur.

## Anomalie visuelle constatée sur capture du 8 novembre
Le panneau gauche affiche `Illustration MicroAlbert à installer dans frontend/public/microalbert-reference-left.png`. **Non corrigé dans G4-P6-A.** Rechercher l'asset original et le restaurer via un correctif graphique indépendant après validation de sa provenance et de sa version. Ne pas prétendre que la recette artistique est complète.

## Critères d'arrêt
Build, tests ou revue pédagogique en échec → BLOQUÉ. Ne pas fusionner main, ne pas déployer, ne pas appeler Albert API. La qualification de sécurité de Pyodide reste ouverte.
