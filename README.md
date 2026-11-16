# MicroAlbert — Atelier Python

[Ouvrir l’atelier sur GitHub Pages](https://darksathili-jpg.github.io/microalbert-lab/) · [Aide Albert](https://darksathili-jpg.github.io/microalbert-lab/aide-albert.html) · [Guide Thonny](https://darksathili-jpg.github.io/microalbert-lab/aide-thonny.html)

150 défis en français, du premier `input()` à SQLite et aux projets de synthèse. L’atelier fourni dans l’archive Windows est désormais la source de l’application. Il comprend le catalogue, la mascotte animée, une console libre et le moteur Python dans le navigateur. Les brouillons et les défis marqués comme terminés sont enregistrés dans le navigateur. Une partie des défis propose une vérification automatique.

## Version publique

Le workflow de la branche `feature/g4-github-pages-preview` vérifie puis publie `dist/`. Les ressources Pyodide 314.0.8 proviennent de la dépendance verrouillée et sont servies par Pages. Le site public propose l’aide locale et fonctionne sans requête vers Albert. Après téléchargement initial des dépendances, la version servie localement fonctionne hors ligne.

## Atelier local et essai Albert

Avec Node.js 24 :

```sh
npm ci
npm start
```

Ouvrir http://127.0.0.1:8765/. Sur Windows, les deux lanceurs du ZIP sont aussi disponibles dans le dépôt. Dans cette version du dépôt, ils utilisent Node.js installé.

Pour un essai enseignant avec une tentative fictive, vérifier d’abord dans le compte officiel Albert que le modèle sélectionné est gratuit et que le quota est disponible. Sous Windows, utiliser `02-Configurer-Albert.cmd` pour saisir la clé de façon masquée et la chiffrer pour le compte Windows, puis relancer. Le serveur local accepte aussi une configuration d’environnement avec `ALBERT_API_KEY`, `ALBERT_MODEL` et `MICROALBERT_REAL_ACCESS_APPROVED=yes`. La clé reste dans la configuration du serveur. Le serveur écoute sur la boucle locale. Une ouverture à des élèves via un serveur distant suppose une authentification réelle et une validation de sécurité.

Dans un défi, choisir **Aide avec Albert**, puis vérifier l’extrait avant de le transmettre. L’aide locale reste accessible si Albert est désactivé ou indisponible.

## Vérifications

```sh
npm ci
npm run build
npm test
npx playwright install chromium
npm run test:browser
```
