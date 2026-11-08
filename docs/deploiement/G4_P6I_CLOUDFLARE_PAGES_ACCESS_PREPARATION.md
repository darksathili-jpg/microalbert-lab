# G4-P6-I — Dossier de préparation Cloudflare Pages + Access

**État : DOCUMENTATION SEULEMENT — AUCUNE PUBLICATION, AUCUNE CONFIGURATION CLOUDFLARE APPLIQUÉE.**

## Objectif
Fournir à quatre élèves pilotes et à leur enseignant un accès navigateur à MicroAlbert Lab, sans accès au dépôt GitHub, sans modèle Albert réel et sans collecte de productions nominatives.

## Architecture candidate (à approuver)
1. Cloudflare Pages sert uniquement les fichiers statiques construits dans `frontend/dist`.
2. Cloudflare Access protège **l'ensemble du domaine de préproduction** avant la remise de la page HTML, des scripts, des ressources Pyodide et des Workers.
3. Le groupe d'accès est limité aux quatre comptes pilotes et aux enseignants autorisés, avec date de fin et procédure de révocation.
4. L'application élève utilise Python dans le navigateur. Le code des élèves ne doit pas être transmis à Albert ou à une API distante.
5. La route `/api/chat` du backend FastAPI local n'est pas automatiquement fournie par Pages. **Ne pas déclarer l'espace Audit opérationnel en hébergement statique.** Avant ouverture aux élèves, masquer/désactiver Audit dans la version pilote ou démontrer qu'il n'est pas accessible aux élèves via un contrôle côté serveur, après validation distincte.
6. Ne pas utiliser une simple URL non indexée comme protection. Ne pas mettre de jeton Access, secret ou identifiant d'élève dans le code client.

## Paramètres de build envisagés (non appliqués)
- Source : dépôt `darksathili-jpg/microalbert-lab`.
- Branche candidate : `feature/g4-p6i-staging-readiness`, à figer sur un SHA vérifié.
- Répertoire racine de construction : `frontend`.
- Commande : `npm ci && npm run build`.
- Répertoire de sortie : `dist` (relatif à `frontend`).
- Runtime Node.js : version compatible avec les dépendances, à fixer et tester avant configuration.
- Domaine de préproduction : **NON CHOISI** ; ne pas inventer d'URL.

Ces paramètres doivent être confirmés selon le mode de connexion du dépôt et la version actuelle de Cloudflare Pages. La présence d'un `frontend/package-lock.json` commité est nécessaire pour `npm ci`.

## Séquence d'autorisation et de vérification

### GATE A — Hors ligne
- [x] Suite Playwright 48/48 communiquée par l'enseignant.
- [x] Build Vite réussi et Pyodide copié, communiqué par l'enseignant.
- [x] Contrôle local des artefacts réussi, communiqué par l'enseignant.
- [x] `frontend/package-lock.json` commité et poussé : `b8d52c1`.
- [ ] **Nouvelle installation `npm ci` après le commit : résultat non communiqué.**
- [ ] Nouvelle compilation après `npm ci` : résultat non communiqué.
- [ ] Revue des requêtes réseau et dépendances externes.
- [ ] Vérification explicite de la non-accessibilité de l'espace Audit pour les élèves pilotes.
- [ ] Revue du contenu construit pour secrets, source maps, fichiers sensibles et données personnelles (le script local ne suffit pas).

### GATE B — Choix et conformité
- [ ] Hébergeur Cloudflare autorisé par l'établissement ; vérification du traitement des données, des journaux et des transferts.
- [ ] Modalité d'identification des élèves choisie et validée ; **ne pas présumer que des comptes personnels sont autorisés**.
- [ ] Liste des personnes autorisées et durée d'accès définies hors du dépôt public.
- [ ] Mécanisme d'accès de secours et révocation définis.
- [ ] Mode Audit désactivé ou isolé de façon vérifiable pour le pilote.
- [ ] Responsable de l'hébergement et procédure d'incident désignés.

### GATE C — Autorisation humaine explicite, puis déploiement séparé
- [ ] Enseignant autorise explicitement la publication de la branche/du commit et le domaine de préproduction.
- [ ] Contrôle Access configuré et **testé en refus d'accès** avant tout partage de lien.
- [ ] Essai anonyme refusé pour `/`, `/assets/*.js`, `/pyodide/pyodide.js` et les fichiers Worker.
- [ ] Essai autorisé réussi ; révocation et déconnexion vérifiées.
- [ ] HTTPS et en-têtes de sécurité contrôlés ; compatibilité CSP/Worker/Pyodide vérifiée.
- [ ] Absence d'appel Albert réel ou de transfert de code élève vérifiée dans l'onglet Réseau.
- [ ] Retour arrière testé (désactiver l'accès, retirer la préproduction).

**Attention :** la configuration Access et le premier déploiement peuvent avoir une fenêtre d'exposition. Il faudra planifier la protection du domaine et le contrôle de son état avant toute communication, et vérifier les règles de protection des éventuelles URL de prévisualisation de branche.

### GATE D — Pilote pédagogique
Après validation de GATE C, suivre `docs/pedagogie/G4_P6H_PROTOCOLE_CLASSE.md`. Ne pas assimiler la réussite technique à une validation pédagogique.

## Commandes locales sans publication
```powershell
git status --short
git log -1 --oneline
npm.cmd --prefix frontend ci
npm.cmd --prefix frontend run build
python scripts/check_staging_artifacts.py
```

## Registre
| Point | État |
|---|---|
| Hébergeur choisi définitivement | NON |
| Cloudflare Access créé | NON |
| Cloudflare Pages créé | NON |
| URL de préproduction | AUCUNE |
| Élèves autorisés | AUCUN |
| Publication autorisée | NON |
| Publication réalisée | NON |

**STOP : ne pas créer de projet Pages, domaine, règle Access ou déploiement sans autorisation explicite distincte.**
