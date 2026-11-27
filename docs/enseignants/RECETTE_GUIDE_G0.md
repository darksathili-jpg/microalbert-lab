# Recette du guide enseignant — G0
**Statut : EN VÉRIFICATION — aucune recette navigateur attestée**

## Préconditions
- Ouvrir `docs/enseignants/guide-installation.html` localement dans Edge et Firefox.
- Ne jamais entrer de clé API dans le guide : c'est une page documentaire autonome.
- Tester sans connexion réseau pour vérifier que la mise en page et les contrôles restent accessibles.

## Contrôles manuels
| ID | Action | Critère d'acceptation |
|---|---|---|
| GE-01 | Ouvrir le fichier | Aucun écran blanc, titres lisibles |
| GE-02 | Suivre chaque lien interne | Bonne section atteinte |
| GE-03 | Basculer clair/sombre/projecteur | Aucune zone sombre en mode projecteur |
| GE-04 | Tester largeur 390 px | Pas de débordement horizontal global |
| GE-05 | Naviguer au clavier | Liens, sélecteur et bouton accessibles |
| GE-06 | Cocher les cinq contrôles | Compteur mis à jour exactement |
| GE-07 | Réinitialiser | Compteur 0/5 et cases décochées |
| GE-08 | Tester hors ligne | Aucune dépendance réseau nécessaire à l'interface |
| GE-09 | Vérifier les commandes PowerShell | Aucune clé affichée ou demandée dans le navigateur |
| GE-10 | Faire relire par un enseignant novice | Procédure reproductible et compréhensible |

## Preuves requises
Captures 1536×1024, 1366×768, 390×844 pour chaque thème; résultats de tests statiques; contrôle des liens officiels; journal d'anomalies; décision humaine.

## Limites
Les tests statiques ne démontrent ni l'ergonomie réelle, ni l'exactitude des liens officiels, ni la validité de la clé API. Le passage à G1 reste interdit sans décision humaine explicite.
