# MicroAlbert — architecture cible du professeur Albert pour la NSI

## Objectif

Permettre aux élèves de Première et Terminale NSI de dialoguer avec un tuteur
pédagogique utilisant l'API Albert, dans le cadre de missions définies par un
enseignant. Le tuteur questionne, aide à déboguer et propose des tests. Les
réponses du modèle ne constituent pas une preuve de correction.

## Séparation impérative

- **GitHub Pages** : fichiers statiques, interface publique, exécution locale
  de Python via Pyodide ; aucune clé Albert et aucun appel direct au fournisseur.
- **Backend HTTPS distinct** : authentification, rôles, quotas, contrôle des
  missions, clé API Albert uniquement côté serveur et appels au fournisseur.
- **Élèves** : accès par une identité gérée par l'établissement ou par un
  dispositif autorisé ; jamais par un jeton administratif codé dans le navigateur.
- **Enseignant** : crée et vérifie les missions, fixe les permissions, surveille
  la qualité pédagogique ; l'audit ne doit pas exposer les échanges personnels.

## État réel du dépôt

- Adaptateur Albert présent et testé avec transport HTTP simulé.
- Route pilote `POST /api/secure/tutor` : authentification enseignant,
  contrôle de rôle, quota et politique de tutorat. Pour les activités du
  catalogue, le jeton de session doit correspondre à l’enseignant et à l’exercice.
  La consigne, les diagnostics structurels et des extraits bornés de la
  difficulté et du programme sont transmis au fournisseur configuré. Le
  pilote peut joindre un cas de test complet, avec l’appel Python, le résultat
  attendu, l’observation saisie et sa justification. Le tuteur peut demander
  d’expliquer un écart ou de justifier le cas. Le navigateur exécute Python
  localement. Le serveur reçoit une observation déclarée et ne certifie pas
  le résultat. La relance précédente est conservée en mémoire par session et
  la réponse passe par le contrôle antisolutions.
- **Aucun appel réel activé par défaut** ; la route renvoie 503 sans adaptateur.
- L'interface publique n'est pas encore connectée au tutorat.
- L'authentification locale en mémoire est une démonstration, pas un système
  de comptes adapté à une classe.
- La consigne envoyée au modèle ne garantit pas qu'il ne révélera jamais une
  solution. Les restrictions importantes doivent être contrôlées côté serveur.

## Essayer le dialogue en simulation

Dans deux terminaux depuis la racine du dépôt, après installation des dépendances :

```bash
PYTHONPATH=backend .venv/bin/python -m app.local_teacher_pilot --simulate-tutor
npm run dev --prefix frontend
```

Ouvrir `http://127.0.0.1:5173` puis **Enseignant**. Saisir le jeton temporaire
imprimé par le serveur (distinct de la clé Albert), choisir un niveau, ouvrir
une session et utiliser **Demander une relance** sous le programme. Le modèle
« Simulation locale » enchaîne des réponses fictives via le même adaptateur
et le même filtrage que le pilote Albert. Ce lanceur n’effectue aucun appel réseau
à Albert. L’interface affiche au plus les dix derniers échanges de la session.

Pour vérifier le parcours, demander une première relance, puis ouvrir
**Préparer et justifier un cas de test**. Saisir l’appel, le résultat attendu
et la justification. Exécuter le code localement, relever la valeur ou
l’exception dans **Résultat observé**, puis demander une nouvelle relance.
Modifier le programme ou l’appel efface l’observation, afin de la refaire
sur la nouvelle version. Changer de session efface le formulaire et les échanges.

La recette automatisée lance le serveur local et le navigateur, utilise le
transport simulé et bloque les requêtes externes de la page. Après installation
des dépendances, elle se lance depuis la racine avec :

```bash
PATH="$PWD/.venv/bin:$PATH" npx playwright test --config=playwright.teacher-pilot.config.cjs
```

## Premier essai Albert réservé à l’enseignant

Vérifier auprès de l’administrateur du compte la gratuité de l’accès, le quota
restant et la politique de dépassement du modèle choisi. Vérifier également
qu’un serveur HTTPS déjà disponible permet un essai privé sans coût
supplémentaire, avec contrôle d’accès enseignant à l’entrée, y compris pour
les ressources et les routes directes. Enregistrer ces vérifications avant
d’activer le fournisseur. Le mode par défaut du lanceur désactive le
fournisseur et le mode simulation utilise un transport fictif, quels que
soient les réglages du compte.

Sur le serveur vérifié, configurer `MICROALBERT_PROVIDER=albert`,
`MICROALBERT_REAL_ACCESS_APPROVED=yes` et `ALBERT_ALLOWED_MODELS` avec le
seul identifiant autorisé pour l’essai. Injecter `ALBERT_API_KEY` depuis
le gestionnaire de secrets serveur et utiliser l’origine HTTPS officielle
configurée par défaut. Sous le contrôle d’accès enseignant déjà vérifié,
lancer le pilote avec la commande ci-dessous. Il écoute uniquement sur
la boucle locale et refuse de démarrer si la configuration Albert n’est
pas approuvée. Servir la version standard compilée sous le même domaine
HTTPS privé et y relayer `/api` vers le pilote local. Ne pas relayer
`/api` depuis la démonstration Pages. Le jeton enseignant généré au démarrage
reste nécessaire pour les routes protégées et doit rester dans la console
administrative jusqu’à la saisie dans le pilote.

```bash
PYTHONPATH=backend .venv/bin/python -m app.local_teacher_pilot --albert
```

Tester d’abord un accès anonyme
refusé et la présence de l’identifiant de modèle dans la liste interne,
puis envoyer un seul tour avec un cas fictif. Vérifier que la réponse pose
une question sur le cas et ne propose pas de corrigé. Consigner la date,
le niveau, le modèle, le statut et l’identifiant de requête, sans clé ni
données d’élève. Désactiver le fournisseur à la fin de l’essai.

## Conditions avant un pilote en classe

1. Valider l'usage de l'API Albert, les modèles autorisés, les règles de
   confidentialité et le cadre de traitement des données avec l'établissement.
2. Déployer le backend sur un hébergement HTTPS administré ; y injecter
   la clé via un gestionnaire de secrets, jamais dans Git ou GitHub Pages.
3. Ajouter une authentification réelle, une politique de sessions, des
   quotas adaptés et une séparation des espaces enseignant/élève.
4. Construire une passerelle de tutorat élève contrôlée par le serveur,
   avec des missions explicitement autorisées.
5. Tester les comportements du modèle sur des questions NSI, des demandes
   de corrigé, des erreurs Python et des tentatives de contournement.
6. Vérifier en navigateur l'expérience complète avant d'annoncer une
   ouverture aux élèves.

## Ressource graphique

L'illustration MicroAlbert fournie dans la conversation doit être déposée
comme `frontend/public/microalbert-reference-left.webp` et contrôlée
dans les artefacts de build. Le code attend ce chemin. La présence de
l'image dans la conversation n'implique pas sa présence dans GitHub.
