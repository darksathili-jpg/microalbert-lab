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
  contrôle de rôle, quota, politique de tutorat, fournisseur injecté seulement.
- **Aucun appel réel activé par défaut** ; la route renvoie 503 sans adaptateur.
- L'interface publique n'est pas encore connectée au tutorat.
- L'authentification locale en mémoire est une démonstration, pas un système
  de comptes adapté à une classe.
- La consigne envoyée au modèle ne garantit pas qu'il ne révélera jamais une
  solution. Les restrictions importantes doivent être contrôlées côté serveur.

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
