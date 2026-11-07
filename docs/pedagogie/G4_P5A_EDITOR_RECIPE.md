# G4-P5-A — Éditeur Python avec coloration syntaxique

**Statut : EN VÉRIFICATION — aucun test exécuté dans l'environnement du contributeur distant.**

## Périmètre effectivement livré
- Branche indépendante `feature/g4-p5a-python-editor` issue de G4-P4 ; aucun merge, aucun déploiement.
- `frontend/src/PythonEditor.tsx` : éditeur contrôlé, numéros de ligne, coloration par lexique, Tab/Maj+Tab, indentation automatique après `:`, position du curseur, synchronisation du défilement.
- `frontend/src/PythonEditor.css` : couleurs dédiées clair/sombre/vidéoprojecteur, focus clavier, affichage mobile, prise en compte du mode de contraste forcé.
- `frontend/src/PythonLab.tsx` : remplacement de la zone de saisie initiale par l'éditeur, sans changer les objectifs pédagogiques.
- `tests/e2e/g4-p5a-python-editor.spec.cjs` : trois scénarios navigateur supplémentaires (présence, indentation, thèmes).

## Limites explicites
- La coloration repose sur une analyse lexicale légère : elle ne constitue pas un analyseur syntaxique Python complet. Les chaînes multilignes et certains cas complexes peuvent nécessiter une amélioration.
- Aucun interpréteur Python ni test de correction algorithmique ; le contrôle de structure G4-P4 reste textuel.
- Aucun appel à Albert API ; aucune persistance des travaux.
- Vérifier manuellement l'alignement de la coloration et du curseur sur Windows/Edge, notamment après défilement horizontal et avec zoom navigateur.
- Vérifier que les combinaisons de touches ne gênent pas la navigation clavier et les technologies d'assistance.

## Recette PowerShell
Depuis la racine du dépôt :
```powershell
git fetch origin
git status -sb
git switch --track origin/feature/g4-p5a-python-editor
npm.cmd --prefix frontend run build
```
Puis, avec Vite démarré :
```powershell
npx.cmd playwright test tests/e2e/g2-r6-app.spec.cjs tests/e2e/g4-p5a-python-editor.spec.cjs
```
Tests backend de non-régression :
```powershell
Set-Location backend
python -m pytest -q
Set-Location ..
```

## Recette visuelle à signer
1. Coloration des mots clés, commentaires, nombres et chaînes.
2. Numéros de ligne correctement alignés, même après défilement.
3. Tab, Maj+Tab et Entrée avec indentation correcte ; édition de plusieurs lignes.
4. Navigation clavier et focus visibles ; vérifier le comportement avec lecteur d'écran.
5. Contrastes et lisibilité en clair, sombre et vidéoprojecteur ; pas de zone sombre en vidéoprojecteur.
6. Affichage mobile et zoom 200 % ; absence de débordement global.
7. Vérifier que le code saisi est conservé entre les onglets « Code Python » et « Mes tests ».

**G4-P5-A ne sera validé qu'après compilation, tests automatisés et recette manuelle.**
