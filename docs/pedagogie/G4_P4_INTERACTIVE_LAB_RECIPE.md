# G4-P4 — Première interface de laboratoire Python

**État : EN VÉRIFICATION.** Première interface intégrée ; exécution Python et coloration syntaxique non encore disponibles.

## Livré
- `frontend/src/PythonLab.tsx` : mission « Une file de messages », éditeur texte de code Python, navigation en cinq phases, trois indices gradués, espace de préparation des tests et résultats attendus.
- `frontend/src/PythonLab.css` : affichage responsive, clair, sombre et vidéoprojecteur, avec contrastes et focus visibles.
- `frontend/src/main.tsx` : intégration dans l'espace Élève, sans modifier le contrat de l'API de démonstration.
- Le code de l'élève reste en mémoire dans le navigateur ; pas de sauvegarde ni d'envoi à Albert API.
- Le contrôle de structure est **textuel seulement** ; il ne vérifie pas réellement la syntaxe Python ni les valeurs renvoyées.

## Écarts par rapport au G4-P4 complet
1. **Exécution isolée Python non réalisée** : prévoir un moteur en Web Worker, des limites de temps et de mémoire, et une politique d'accès au réseau et au système de fichiers ; aucun `exec` non isolé côté serveur.
2. **Coloration syntaxique non réalisée** : éditeur texte monospace seulement. À intégrer et vérifier pour l'accessibilité.
3. **Tests automatisés des solutions élèves non réalisés** : seuls des exemples d'appels et leurs résultats attendus sont affichés.
4. **Enseignant virtuel conversationnel non connecté** : questions et indices déterministes, sans modèle réel.
5. **Contrôles enseignant et authentification institutionnelle non intégrés**.

## Recette PowerShell
```powershell
git fetch origin
git switch --track origin/feature/g4-p4-interactive-python-lab
Set-Location backend
python -m pytest -q
Set-Location ..
npm.cmd --prefix frontend run build
```
Avec Vite démarré :
```powershell
npx.cmd playwright test tests/e2e/g2-r6-app.spec.cjs
```

## Recette manuelle
1. Ouvrir l'espace Élève et repérer « Une file de messages ».
2. Saisir deux fonctions ; vérifier que le bouton « Vérifier la structure » répond.
3. Demander trois indices ; vérifier que le quatrième est bloqué.
4. Passer à « Mes tests », renseigner des observations et revenir à l'éditeur : le texte doit être conservé.
5. Vérifier les modes clair, sombre et vidéoprojecteur, la navigation clavier et la lisibilité mobile.
6. Vérifier qu'aucun bouton ne prétend exécuter réellement Python.

**Aucun merge dans `main`, aucun déploiement, aucune connexion réelle à Albert API.**
