# G4-P5-B — Contrat d'exécution Python isolée (cadrage initial)

**Statut : SPÉCIFIÉ — implémentation non commencée ; G4-P5-A reste à valider par compilation et recette visuelle.**

## Objectif
Permettre à l'élève de lancer le code de son éditeur et de lire stdout, stderr, erreurs Python et état d'exécution, sans jamais transmettre le programme à l'API Albert ni l'exécuter dans FastAPI.

## Architecture retenue pour le prototype
1. Python via Pyodide, servi **localement** avec les ressources du projet (aucun chargement CDN ni téléchargement à l'exécution).
2. Interpréteur dans un Web Worker dédié, créé à chaque exécution ; ne pas réutiliser l'état Python d'une exécution à l'autre.
3. Arrêt explicite : terminer le Worker ; expiration du délai : terminer le Worker et afficher une erreur de délai. Ne pas prétendre que le Worker est un bac à sable de sécurité pour du code hostile.
4. Ne pas donner au Worker de jetons, de données personnelles, ni de capacités applicatives. Évaluer séparément les risques de réseau et de chargement de modules, la politique CSP, la taille des sorties et la consommation mémoire. Un timeout n'impose pas à lui seul une limite de mémoire.
5. La sortie standard et les erreurs sont affichées en texte brut, jamais interprétées comme HTML.
6. La mission G4-P4 conserve ses cinq phases, son budget de trois indices et son contrôle structurel distinct de l'exécution.

## Tests d'acceptation obligatoires
- Programme simple : `print(2 + 3)` → sortie `5`.
- `SyntaxError` → message Python explicite ; application toujours utilisable.
- `ZeroDivisionError` → erreur explicite, sans fermeture de l'application.
- `while True: pass` → expiration et destruction du Worker ; nouvelle exécution possible.
- Arrêt manuel d'un programme long ; absence de sortie tardive réaffectée après annulation.
- Deux exécutions successives : aucune variable globale de la première n'est conservée.
- Sortie très longue : plafonnement et signalement de la troncature.
- Vérification de l'absence de requête vers Albert API et vers un CDN.
- Non-régression des trois tests G4-P5-A et des quatre tests G2-R6 ; compilation TypeScript/Vite.
- Recette visuelle en clair, sombre et vidéoprojecteur, y compris navigation clavier.

## Critères d'arrêt
Si le runtime Python ne peut pas être empaqueté localement, ou si les risques réseau/ressources ne sont pas correctement encadrés, rester **BLOQUÉ** et ne pas activer le bouton Exécuter. Aucun déploiement ni fusion dans main.

## Preuves attendues
Journal de compilation, rapport Playwright (Edge autorisé par configuration explicite), traces des tests timeout/annulation et captures des trois thèmes. Les tests ne sont pas réputés réussis sans exécution réelle.


## État d'implémentation initiale — 2026-11-08
Les fichiers suivants ont été ajoutés : `frontend/src/python-runtime.worker.js`, `frontend/src/PythonRunner.tsx`, `frontend/src/PythonRunner.css`, `frontend/scripts/copy-pyodide.mjs`, `tests/e2e/g4-p5b-python-runtime.spec.cjs`. `PythonLab.tsx` et `frontend/package.json` ont été modifiés.

**Aucune compilation ni exécution de tests n'a été réalisée dans cette session.** Le statut demeure **EN VÉRIFICATION**.

### Installation et recette locale
À la racine du dépôt, sur la branche dédiée :
```powershell
npm.cmd --prefix frontend install
npm.cmd --prefix frontend run build
npm.cmd --prefix frontend run dev -- --strictPort
```
Dans un second terminal :
```powershell
npx.cmd playwright test g4-p5b-python-runtime.spec.cjs --config=playwright.edge.config.cjs --reporter=list --workers=1
```
La configuration Edge temporaire doit déjà exister localement. Si elle n'existe pas, la créer explicitement ; ne pas dépendre d'une installation Chromium bloquée.

### Risques et critères non encore couverts
- L'installation NPM doit créer ou actualiser le fichier de verrouillage `frontend/package-lock.json` ; ne pas déclarer reproductible une installation sans vérification du verrouillage.
- Le Worker n'empêche pas intrinsèquement l'accès réseau. **Ne pas présenter cette version comme un environnement sûr pour du code Python non fiable.**
- L'exécution asynchrone Python peut demander des modules ou ressources supplémentaires ; vérifier l'absence de téléchargements externes et la politique de sécurité des contenus.
- Le délai de 8 s inclut l'initialisation du moteur : sur une machine lente, même `print(5)` peut expirer. Mesurer les performances avant la recette.
- La mémoire du Worker n'est pas plafonnée ; aucune garantie contre une consommation excessive.
- Tester séparément la réinitialisation de l'état, la troncature des sorties, les erreurs de syntaxe, le zoom, les thèmes et l'absence d'appel à Albert API.
- En cas d'échec du build ou d'un test : **BLOQUÉ** ; ne pas fusionner ni déployer.
