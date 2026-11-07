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

## G2-R2 — 2026-11-07
- Séparation effective dans le JSX entre fiche pédagogique statique et résultat conditionnel du simulateur ; le résultat ne s'affiche qu'après réponse.
- Logo de référence désormais chargé via /microalbert-reference-logo.png avec symbole de repli.
- Paquet ZIP de deux découpes PNG fourni à l'utilisateur ; ces images ne sont pas versionnées dans la branche GitHub et doivent être extraites localement dans frontend/public/.
- Compilation TypeScript, tests backend, navigateur et recette de contraste non exécutés dans cette intervention ; G2-R2 reste EN VÉRIFICATION.
- Ne pas fusionner ni publier.

## G2-R3 — 2026-11-07
- Corrigé le panneau de gauche pour respecter le ratio natif 374/916 du recadrage fourni, sans object-fit:cover ni étirement.
- Adaptation responsive pour écrans étroits : image centrée et plafonnée en hauteur.
- Vérification visuelle, compilation, trois thèmes et interactions : NON TESTÉS dans cette intervention.
- G2 reste EN VÉRIFICATION. Aucune fusion ni publication.

## G2-R4 — 2026-11-07
- En mode vidéoprojecteur, masquer le logo PNG sur fond sombre et afficher provisoirement un symbole atomique monochrome sur fond blanc.
- Forcer les titres, sous-titres, exemples Python, contrôles et résultats à utiliser un texte noir sur fond blanc.
- Maintenir l'illustration gauche en niveaux de gris ; son tableau peut comporter des zones grises foncées propres à l'illustration, distinctes des surfaces d'interface.
- Actif MicroAlbert transparent et indépendant : NON RÉALISÉ ; extraction/validation artistique nécessaires, ne pas prétendre que le PNG de composition est un sprite.
- Compilation, captures comparatives et tests de régression : NON EXÉCUTÉS. G2-R4 EN VÉRIFICATION.
