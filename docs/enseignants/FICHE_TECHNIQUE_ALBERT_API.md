# Fiche technique enseignant — Configurer Albert API avec MicroAlbert Lab
**Version : 0.1 — 6 novembre 2026**  
**Public : enseignants de Première et Terminale NSI**  
**Statut : procédure de référence expérimentale, à vérifier avant diffusion institutionnelle.**

## 1. Objet et limites
Cette fiche décrit la connexion à Albert API depuis un poste Windows, l'installation du prototype local et les diagnostics courants. Elle distingue l'assistant Albert dans Nuage de l'accès **Albert API**, qui nécessite une clé dédiée. L'accès à Nuage ne prouve pas que l'API est activée.

Sources officielles à consulter avant diffusion :
- Présentation : https://ia.numerique.gouv.fr/outils-ia/albert-api/
- Documentation API : https://albert.api.etalab.gouv.fr/reference
- Portail Apps Éducation : https://portail.apps.education.fr/

Les interfaces, modalités d'accès, modèles et quotas peuvent évoluer. Ne jamais promettre l'éligibilité ou la gratuité sans vérification actualisée des conditions officielles.

## 2. Prérequis
- Windows 10/11, PowerShell, Python 3.10 ou supérieur.
- Connexion HTTPS sortante vers le service API.
- Accès professionnel et clé Albert API **personnelle et autorisée**.
- Prototype MicroAlbert local fourni par un canal de confiance.
- Ne pas utiliser de données personnelles d'élèves dans l'expérimentation.

## 3. Obtenir la clé
1. Ouvrir le portail officiel Albert API.
2. Suivre le lien d'accès et le parcours d'authentification professionnelle proposé (notamment ProConnect si affiché).
3. Sélectionner l'académie et s'authentifier sur les pages officielles.
4. Dans l'espace autorisé, rechercher la gestion des clés API.
5. Créer une clé d'expérimentation et la conserver dans un gestionnaire de secrets. Si la clé n'est affichée qu'une fois, la sauvegarder immédiatement dans un emplacement sécurisé.
6. En cas de blocage académique, tester séparément le portail académique et contacter l'assistance compétente; ne pas déduire qu'une erreur de connexion à Eduline est une panne d'Albert.

Ne jamais transmettre une clé par courriel, messagerie, capture d'écran ou dépôt GitHub.

## 4. Enregistrer la clé dans PowerShell sans la taper
Le collage Ctrl+V peut produire `^V` dans certains terminaux. **Ne pas retaper la clé caractère par caractère.**

1. Copier la clé depuis son emplacement sécurisé.
2. Ouvrir PowerShell et exécuter :
```powershell
$env:ALBERT_API_KEY = (Get-Clipboard).Trim()
[string]::IsNullOrWhiteSpace($env:ALBERT_API_KEY)
Set-Clipboard -Value ""
```
La deuxième commande doit afficher `False`. Cela confirme uniquement qu'une valeur existe, pas qu'elle est valide.

**Précaution** : le presse-papiers peut être historisé ou synchronisé. Préférer, lorsque disponible, un gestionnaire de secrets ou une méthode de saisie sécurisée. Éviter de coller la clé dans la ligne de commande elle-même.

La variable `$env:ALBERT_API_KEY` ne persiste pas après fermeture de la session PowerShell. C'est voulu : ne pas rendre le secret permanent dans le profil Windows par défaut.

## 5. Tester l'authentification
Dans la **même** session PowerShell :
```powershell
$headers = @{ Authorization = "Bearer $env:ALBERT_API_KEY" }
Invoke-RestMethod -Method Get -Uri "https://albert.api.etalab.gouv.fr/v1/models" -Headers $headers |
  Select-Object -ExpandProperty data |
  Select-Object id
```
Résultat attendu : identifiants des modèles accessibles. Tous les modèles listés ne sont pas nécessairement compatibles avec `/chat/completions`. Ne pas choisir automatiquement un modèle d'embedding, de reranking, d'OCR ou de transcription.

## 6. Installer et démarrer le prototype local V0.1
Décompresser l'archive dans un dossier local; vérifier qu'il contient `server.py` et `index.html`. Ouvrir PowerShell dans ce dossier **après avoir défini la variable d'environnement** :
```powershell
py --version
py server.py
```
Ouvrir `http://127.0.0.1:8765` dans Edge. Choisir un modèle de conversation connu comme compatible, envoyer une question sans données personnelles et vérifier la réponse. Arrêter avec `Ctrl+C` dans PowerShell.

**Attention** : le serveur V0.1 n'est pas destiné à être publié ni ouvert sur le réseau de l'établissement. Il n'est pas audité pour un usage multi-utilisateur.

## 7. Diagnostic méthodique
| Symptôme | Interprétation possible | Action |
|---|---|---|
| `TcpTestSucceeded : True` sur port 443 | Le port est accessible, pas une preuve d'authentification | Tester la requête HTTPS |
| `404` sur la racine `/` | Aucun endpoint sur la racine | Tester `/v1/models` |
| `401 Not authenticated` | Jeton absent, mal transmis ou invalide | Vérifier la présence de la variable et le header Bearer, sans afficher la clé |
| `403 Forbidden` | Droits insuffisants ou politique d'accès | Vérifier les autorisations du compte |
| `429` | Quota ou limite de débit | Attendre et vérifier les quotas |
| `Ctrl+V` affiche `^V` | Collage non pris en charge par le terminal | Utiliser Get-Clipboard |
| `True` au test IsNullOrWhiteSpace | Variable absente ou vide | Recharger la clé dans la session |
| L'interface s'ouvre mais aucun modèle ne fonctionne | Modèle incompatible ou erreur fournisseur | Sélectionner un modèle de conversation et relever le code d'erreur |
| Réponse coupée | Limite de génération possible | Contrôler `finish_reason` dans la future version |
| Markdown brut visible | Défaut de rendu côté interface | Ouvrir une anomalie; ne pas déclarer le rendu conforme |

Pour tester le port :
```powershell
Test-NetConnection albert.api.etalab.gouv.fr -Port 443
```
Pour vérifier la réponse HTTPS :
```powershell
curl.exe -i "https://albert.api.etalab.gouv.fr/v1/models"
```
Sans clé, une réponse `401` est attendue si l'endpoint est disponible et protégé.

## 8. Recette enseignant minimale
- [ ] Clé API non visible dans le navigateur, les captures ou Git.
- [ ] `/v1/models` répond avec authentification.
- [ ] Modèle conversationnel sélectionné et réponse obtenue.
- [ ] Exemple Python vérifié pour syntaxe, indentation et exactitude.
- [ ] Modes Élève, Enseignant, Audit testés individuellement.
- [ ] Aucune donnée personnelle d'élève saisie.
- [ ] Fermeture du serveur et effacement du presse-papiers vérifiés.

**La réussite de la connexion ne vaut ni certification pédagogique, ni autorisation de déploiement.**
