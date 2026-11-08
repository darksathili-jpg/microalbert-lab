# G4-P6-H — Expérimentation pédagogique encadrée (Terminale NSI)

**État : PRÊT POUR RECETTE HUMAINE — NON VALIDÉ EN CLASSE.**
Ce document est un protocole de recueil de preuves, pas un compte rendu de résultats. Aucun résultat d'élève n'est inventé.

## Hypothèse et critère de décision
**Hypothèse :** après une tentative incorrecte, l'élève peut interpréter les tests publics, corriger son programme et justifier un cas inédit **sans accéder à un corrigé automatique**.

**Succès de la recette pilote :** tous les critères de sécurité et d'ergonomie ci-dessous sont respectés, et au moins 3 des 4 critères d'apprentissage observables atteignent le niveau 2 pour au moins 3 élèves sur 4. Ces seuils sont **locaux et exploratoires** : ils ne démontrent pas l'efficacité générale de MicroAlbert.

## Préparation (enseignant, 10 minutes)
1. Utiliser uniquement la branche `feature/g4-p6h-pedagogical-field-trial` en local ; aucune publication.
2. Vérifier les trois modes d'affichage, la disponibilité du moteur Python et l'absence du bouton « Interroger le simulateur » dans Élève et Enseignant.
3. Préparer quatre postes ou quatre passages indépendants. Attribuer des codes temporaires E1 à E4 **sans conserver de correspondance nominative**.
4. Ne pas saisir de noms, d'identifiants, de travaux personnels ni d'informations sensibles dans les champs de l'application. Ne pas photographier les élèves.
5. Prévoir une feuille d'observation par élève, remplie manuellement. L'application ne sauvegarde pas les productions.

## Déroulement (25 à 35 minutes)
**Phase A — Prévision (5 min).** Mission Balises lumineuses, onglet Mes tests. Sans exécuter de code, demander de prévoir :
- `regrouper([])`
- `regrouper(['OFF','ON','OFF'])`
- `regrouper(['ON'] * 4)`

**Phase B — Diagnostic (5 min).** Fournir le code défectueux suivant (sans annoncer le défaut) :
```python
def regrouper(etats):
    return [(etat, etats.count(etat)) for etat in dict.fromkeys(etats)]
```
Demander : « Quelle observation te permet de remettre en question ce programme ? » L'élève doit exécuter les tests publics et nommer un cas discriminant.

**Phase C — Correction autonome (10 à 15 min).** L'élève remplace le code et peut demander jusqu'à trois indices. Ne pas communiquer de solution. Noter les essais, les indices demandés et les justifications, sans enregistrer le code nominativement. Si l'élève reste bloqué, marquer « aide humaine nécessaire » et ne pas compter une correction autonome.

**Phase D — Transfert inédit (5 min).** Sans donner le résultat, demander de prévoir et de justifier :
```python
regrouper(['ON','OFF','OFF','ON','ON','OFF'])
```
Attendu enseignant uniquement : `[('ON', 1), ('OFF', 2), ('ON', 2), ('OFF', 1)]`.
Faire vérifier la non-modification de la liste reçue et demander pourquoi deux plages « ON » restent distinctes.

**Phase E — Retour d'usage (3 min).** Questionner : « Qu'est-ce qui t'a permis de comprendre l'erreur ? » ; « Quel indice a été utile ? » ; « Quelle partie de l'interface t'a gêné ? ».

## Grille d'observation (une ligne par élève)
Notation : 0 = non démontré ; 1 = partiel / avec aide ; 2 = autonome et justifié ; NV = non vérifié.

| Code | Prévision avant exécution | Cas discriminant identifié | Correction justifiée | Transfert inédit justifié | Indices (0–3) | Aide humaine | Incident technique | Observations factuelles |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| E1 | NV | NV | NV | NV | NV | NV | NV | |
| E2 | NV | NV | NV | NV | NV | NV | NV | |
| E3 | NV | NV | NV | NV | NV | NV | NV | |
| E4 | NV | NV | NV | NV | NV | NV | NV | |

## Contrôles bloquants
- **BLOQUÉ** si le code n'est pas exécuté, si un résultat erroné est annoncé comme « mission validée », si un corrigé apparaît automatiquement, ou si des données personnelles sont transmises à un service externe.
- **À CORRIGER** si un élément de l'interface est inaccessible, si le tuteur donne une indication incohérente avec la mission, ou si le moteur présente des résultats impossibles à interpréter.
- **NON CONCLUANT** si moins de quatre observations exploitables sont disponibles ou si le temps / l'aide reçue n'est pas documenté.

## Bilan à renseigner après expérimentation
- Date et contexte : **non renseignés**
- Nombre d'élèves observés : **0**
- Critères de sécurité et d'ergonomie : **non vérifiés**
- Résultats agrégés anonymes : **non disponibles**
- Anomalies et preuves reproductibles : **non disponibles**
- Décision : **ATTENTE_HUMAINE — recette pédagogique non exécutée**

**Important :** les 48 tests Playwright validés en G4-P6-G sont des preuves de non-régression technique, pas des preuves de progression des élèves. Ne pas fusionner `main` ni déployer sans autorisation distincte.
