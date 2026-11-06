# G2 — Référence et état de la première intégration

Date : 2026-11-06. Statut : EN VÉRIFICATION, NON VALIDÉ.

## Référence
- Image fournie dans la conversation : « MicroAlbert Lab — Boucle Python illustrée », 1536 × 1024.
- Composition : en-tête indigo, panneau illustré à gauche (environ 24 %), trois onglets et panneau de travail à droite, encart réponse en deux colonnes.
- Trois modes : clair, sombre, vidéoprojecteur. La version projecteur doit éliminer les surfaces sombres.

## Intégration
- Le CSS et le composant React ont été modifiés sur feature/g2-visual-fidelity.
- L'illustration de gauche est **une découpe temporaire de la maquette**, pas un sprite indépendant ni une ressource animable. Elle n'est pas incluse dans GitHub : l'utilisateur doit la déposer dans frontend/public/microalbert-reference-left.png pour la prévisualisation locale.
- Aucun logo final approuvé n'est intégré : marque typographique provisoire.
- Le sélecteur de modèles est volontairement limité au fournisseur simulé. Les textes pédagogiques affichés sont statiques et identifiés comme tels.
- La fidélité visuelle n'a pas encore été mesurée par captures comparatives.
- Aucun test de compilation, navigateur ou accessibilité n'a été exécuté après ces modifications.

## Contrôles requis avant validation G2
1. npm run build et tests backend non régressifs.
2. Captures Playwright 1536×1024, 1366×768, 390×844 pour les trois thèmes.
3. Comparaison manuelle avec la référence ; anomalies numérotées.
4. Vérification contraste, navigation clavier, débordements et absence de zones sombres en mode vidéoprojecteur.
5. Actif MicroAlbert autonome, droits et provenance confirmés, sans personnages dupliqués.
6. Recette humaine et décision explicite.

Aucune fusion ni publication.
