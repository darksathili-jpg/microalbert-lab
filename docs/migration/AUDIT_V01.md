# Audit de migration Albert NSI V0.1
Statut : INCOMPLET — sources originales non disponibles dans ce dépôt.

Observations rapportées lors de l'expérimentation :
- La clé Albert fonctionne depuis PowerShell et GET /v1/models renvoie des modèles.
- Une réponse pédagogique a été générée et rendue par une interface locale.
- Markdown brut et échappements visibles (titres, gras, tableaux) signalés.
- Une réponse a semblé tronquée sans preuve finish_reason.
- Erreurs de fond relevées dans le traitement de range et des boucles bornées.
- Modes Enseignant/Audit, thèmes et fonctionnement de tous les boutons non encore audités.

Risques de migration : aucun inventaire des fichiers, aucun manifeste de dépendances, aucune provenance d'assets, aucun résultat de tests automatisés récupéré à ce stade.

Action : obtenir les sources V0.1 et un jeu de captures de référence, vérifier les tests et relever les SHA des assets. Aucune qualité du code prototype n'est présumée.
