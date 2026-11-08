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
