# Contrat d'orchestration des agents — G0
Statut : défini, non automatisé.

Rôles : orchestrateur (découpage, arrêt), architecte (contrats), designer (fidelité visuelle), développeur (code), expert NSI (programme), testeur (preuves) et auditeur (indépendant). Ce document définit des responsabilités; il ne prétend pas que des agents autonomes sont déjà déployés.

États : SPÉCIFIÉE → EN_DÉVELOPPEMENT → EN_VÉRIFICATION → ATTENTE_HUMAINE → VALIDÉE. Depuis chaque état : BLOQUÉE si anomalie bloquante ou preuve absente.

Permissions minimales :
- Orchestrateur : créer/ordonner les missions, ne pas se déclarer validateur final.
- Développeur : modifier uniquement fichiers de la mission, jamais les secrets.
- Designer : actifs graphiques et tests de rendu; pas de modification API.
- Expert NSI : énoncés, tests pédagogiques et avis.
- Testeur : tests/rapports; ne modifie pas silencieusement le code audité.
- Auditeur : vérifie la concordance des preuves, n'efface pas les anomalies.
- Humain : seul habilité à approuver fusion et publication.

Preuves minimales : identifiant mission, SHA commit, fichiers modifiés, commandes exécutées, résultats, anomalies restantes, artefacts captures, signature de décision humaine lorsqu'applicable.

Politique fail-closed : pas de branche principale modifiée sans besoin explicite; aucune publication; absence de preuve = NON TESTÉ, jamais OK.
