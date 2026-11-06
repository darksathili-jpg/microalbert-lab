# MicroAlbert Lab — Plan d'exécution G1
Date : 2026-11-06
Statut : PRÉPARATION AUTORISÉE — IMPLÉMENTATION ET RECETTE NON VALIDÉES

## Entrée G1
- Validation humaine déclarée : six contrôles du guide enseignant G0 satisfaisants.
- 14/14 tests Playwright locaux rapportés sous Microsoft Edge ; 14/14 en CI.
- Configuration Edge ajoutée localement par l'utilisateur, non présumée versionnée.
- G0 global : validation du guide constatée ; toute autre réserve documentaire reste traçable.
- Pas de fusion vers main, pas de publication, pas de service accessible aux élèves.

## Objectif strict de G1
Fournir une fondation exécutable et testable, **sans prétendre livrer la maquette finale** :
1. Client Vite / React / TypeScript strict, avec structure des panneaux Élève, Enseignant, Audit.
2. Serveur FastAPI/Pydantic local, lié à 127.0.0.1, avec /api/health, /api/models, /api/chat.
3. Adaptateur Albert isolé : fournisseur simulé par défaut ; accès réel seulement sur configuration explicite et clé serveur.
4. Schémas et erreurs contractuels, délais et limites d'entrées, aucune fuite de secret, aucune journalisation de contenu élève.
5. Tests frontend/backend et CI reproductibles, avec cas d'erreur (401/429/502/504) simulés.
6. Documenter lancement local, limites, risques, preuves et anomalies.

## Séquence et rôles
- Architecte : valider arborescence, frontières de confiance, schémas, contrats.
- Développeur : implémenter par petits lots séparés (API mock, client, liaison).
- Testeur : écrire et exécuter tests de contrats, erreurs, secrets et compilation.
- Orchestrateur : contrôler périmètre, preuves, échecs ; statut BLOQUÉ si secret exposé ou test critique non exécuté.

## Critères de sortie G1
- Compilation TypeScript stricte et build réussis.
- Tests automatisés backend/frontend réellement exécutés et résultats conservés.
- Fournisseur mock fonctionnel, sans réseau Albert.
- Secret absent du bundle frontend, des réponses et des traces.
- Erreurs et timeouts couverts par tests.
- Recette humaine explicite avant passage à G2.

## Hors périmètre G1
- Sprite définitif et fidélité visuelle complète : G2, avec assets approuvés.
- Qualité des réponses IA et rendu Markdown sécurisé complet : G3.
- Éditeur Python et validation pédagogique par exécution : G4.
- Déploiement institutionnel, traitement de données d'élèves : G5.

## Décision
G1 PRÉPARÉ — pas encore implémenté ni validé.
Aucune fusion, aucun déploiement sans nouvelle autorisation humaine.
