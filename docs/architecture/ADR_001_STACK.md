# ADR-001 — Pile technique
Statut : proposé, en attente de validation G0

Décision : React/TypeScript strict + Vite côté client; FastAPI/Pydantic côté serveur; CodeMirror 6 pour l'édition; Pyodide dans Web Worker pour l'exécution pédagogique; pytest, Ruff, Vitest, Testing Library et Playwright pour les contrôles.

Motif : composants testables, séparation des responsabilités, contrôle de l'API et vérification dans le navigateur.

Alternatives envisagées : interface HTML monolithique (simple mais peu évolutive); backend Node (évite deux langages mais réduit la proximité avec les TP Python); exécution Python serveur (surface de risque plus forte sans isolation dédiée). L'utilisation de Pyodide impose de tester taille de téléchargement, performances et compatibilité navigateurs.

Réversibilité : adaptateur fournisseur abstrait; éditeur indépendant du moteur d'exécution; design tokens indépendants des composants.
