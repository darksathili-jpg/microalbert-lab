# G4-PAGES-01 — Publication publique de démonstration

**Branche de publication :** `feature/g4-github-pages-preview`. Aucune fusion dans `main`.

## Fonctionnement
Le workflow `.github/workflows/microalbert-pages.yml` déclenche automatiquement les tests navigateur, le build Vite en mode `public-demo`, le contrôle des artefacts et le contrôle statique des chaînes sensibles. **Le déploiement n'est tenté que si toutes ces étapes réussissent.**

La version publique dispose d'un point d'entrée distinct `frontend/src/main-public.tsx` et n'importe pas le composant principal contenant les espaces Enseignant/Audit. Le chemin de base Vite est `/microalbert-lab/`. Le chargement Pyodide est relatif à l'URL du Worker.

## Configuration initiale GitHub nécessaire
Dans **Settings > Pages > Build and deployment > Source**, sélectionner **GitHub Actions**. Selon les paramètres de sécurité du dépôt et de l'environnement `github-pages`, une approbation de déploiement peut être nécessaire.

L'URL cible est `https://darksathili-jpg.github.io/microalbert-lab/` ; **elle n'est confirmée accessible qu'après un workflow vert et un contrôle HTTP/navigateur**.

## Avertissements
- GitHub Pages est public ; aucune authentification des élèves.
- Aucun backend FastAPI ni accès Albert API réel n'est déployé.
- La démonstration ne doit contenir aucune donnée personnelle ou secret.
- Le contrôle du bundle par chaînes est un garde-fou, pas une preuve exhaustive de confidentialité.
- Les tests actuels ne démontrent pas la réussite de toutes les missions ; effectuer une recette pédagogique indépendante avant usage en classe.
- Les tests Playwright installent encore des dépendances racine sans lockfile ; verrouiller ensuite la chaîne.

## Conditions de validation
- [ ] Workflow Pages complet terminé avec succès.
- [ ] URL GitHub Pages accessible.
- [ ] Pyodide exécute effectivement Python sur le site déployé.
- [ ] Modes clair/sombre/vidéoprojecteur vérifiés sur le site.
- [ ] Absence de contenu Enseignant/Audit dans les fichiers servis contrôlée.
- [ ] Validation pédagogique distincte.
