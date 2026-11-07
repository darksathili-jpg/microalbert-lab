# G4-P3 — Première mission NSI : une file de messages

**Statut : EN VÉRIFICATION — module pédagogique Python hors ligne, non intégré à l'interface élève.**

## Références et positionnement

- Niveau : Terminale, spécialité Numérique et sciences informatiques (NSI).
- Compétences : structures de données abstraites, files, implémentation Python, spécification, mise au point et tests.
- Inspiré des **compétences** évaluées dans les sujets du baccalauréat NSI 2026, notamment les exercices comportant des files et de la programmation ; **énoncé original**, non présenté comme un sujet officiel ni comme un travail approuvé par l'inspection.
- Sources et matrice : `docs/pedagogie/G4_P1_REFERENTIEL_NSI_BAC_2026.md`.

## Contrat élève

**Mission** : dans un système fictif de traitement de messages, les messages sont traités dans l'ordre de leur arrivée. Une file est représentée par une liste Python.

1. Expliquer l'ordre « premier entré, premier sorti » (FIFO).
2. Proposer une stratégie pour ajouter un message et retirer le plus ancien.
3. Écrire soi-même `enfiler(file, valeur)` et `defiler(file)`.
4. Tester l'ajout de deux valeurs, le retrait d'une file vide et la conservation de l'ordre.
5. Justifier la différence entre une file et une pile.

**Spécification proposée** : `enfiler` modifie la liste en place ; `defiler` retire et renvoie le premier élément, ou renvoie `None` si la file est vide. Cette convention est propre à cette mission.

**Exemples d'appel et résultats attendus** :

```python
f = []
enfiler(f, 7)
enfiler(f, 4)
print(f)       # [7, 4]
print(defiler(f))  # 7
print(defiler([])) # None
```

## Accompagnement par l'enseignant virtuel

- Découverte : reformuler le problème.
- Recherche : demander quelle opération sur une liste pourrait convenir.
- Implémentation : analyser la syntaxe et la présence des fonctions ; ne pas fournir le code final.
- Vérification : demander des cas limites et les valeurs renvoyées.
- Bilan : demander de justifier le comportement de la file.

Le code est analysé par `ast.parse` sans exécution. **Une analyse syntaxique positive ne prouve pas que les fonctions sont correctes.** L'exécution des programmes des élèves nécessitera un bac à sable isolé avec limites de ressources et tests déterministes. Un simple `exec` côté serveur est interdit.

## Exigences avant intégration élève

- Construire un éditeur clair avec coloration syntaxique et aide accessible, puis modes sombre et vidéoprojecteur.
- Ajouter une exécution Python isolée côté navigateur ou dans un environnement sécurisé ; tests indépendants, temps limité, aucune capacité réseau ou système de fichiers.
- Conserver les traces de progression sans enregistrer de données personnelles inutiles.
- Mettre en place des aides progressives et un contrôle enseignant sur la divulgation des corrigés.
- Vérifier la cohérence avec les attendus des sujets pratiques 2026 après lecture détaillée des documents officiels.

## Recette PowerShell

Depuis la racine du dépôt :

```powershell
git fetch origin
git switch --track origin/feature/g4-p3-first-nsi-mission
Set-Location backend
python -m pytest -q
Set-Location ..
npm.cmd --prefix frontend run build
```

Avec Vite démarré :

```powershell
npx.cmd playwright test tests/e2e/g2-r6-app.spec.cjs
```

**Aucune fusion dans `main`, aucun déploiement et aucune connexion réelle à Albert API.**
