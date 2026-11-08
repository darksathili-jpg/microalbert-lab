# G4-P6-B — Mission pilote originale P1 : Balises lumineuses

Statut : SPÉCIFIÉE — non intégrée, non testée dans le navigateur. Cette mission est une transposition originale de compétences repérées dans la fiche RLE de l'enseignant ; elle ne reproduit pas le sujet de certification 2026.

## Objectifs et prérequis
Terminale NSI ; listes Python, parcours par une boucle bornée, tests d'égalité, fonctions, tuples. L'élève doit expliquer pourquoi une suite de valeurs identiques peut être représentée par un couple (valeur, effectif). RLE : Run-Length Encoding, codage par plages.

## Consigne élève
Un dispositif MicroAlbert mesure une suite d'états lumineux codés par les chaînes 'ON' et 'OFF'. Écrire la fonction regrouper(etats) qui renvoie une liste de couples (etat, effectif) correspondant aux plages consécutives de même état. Une liste vide donne une liste vide. Ne pas modifier la liste reçue. Chaque effectif doit être strictement positif. Les plages consécutives de même état ne doivent pas être séparées artificiellement.

## Exemples d'appels et résultats
- regrouper([]) renvoie []
- regrouper(['ON']) renvoie [('ON', 1)]
- regrouper(['ON','ON','OFF','OFF','ON']) renvoie [('ON', 2), ('OFF', 2), ('ON', 1)]
- regrouper(['OFF','ON','OFF']) renvoie [('OFF', 1), ('ON', 1), ('OFF', 1)]

## Code initial à compléter (aucune solution livrée)
```python
def regrouper(etats):
    # Compléter les instructions nécessaires.
    pass
```

## Indices gradués
1. « Que doit renvoyer la fonction lorsque la liste ne contient aucun état ? »
2. « Pour reconnaître une nouvelle plage, quelle comparaison peut-on effectuer avec l'état de la plage en cours ? »
3. « Quand faut-il ajouter le couple en cours à la liste résultat ? Que faut-il faire après la dernière itération ? »

## Tests de comportement à écrire (enseignant / évaluateur, séparés du mode élève)
| ID | Entrée | Résultat attendu | Défaut détecté |
|---|---|---|---|
| T01 | [] | [] | accès à l'indice 0 sans contrôle |
| T02 | ['ON'] | [('ON',1)] | oubli de la dernière plage |
| T03 | ['ON','ON','ON'] | [('ON',3)] | rupture artificielle d'une plage |
| T04 | ['OFF','ON','OFF'] | [('OFF',1),('ON',1),('OFF',1)] | regroupement non consécutif |
| T05 | ['ON','ON','OFF','OFF','ON'] | [('ON',2),('OFF',2),('ON',1)] | oubli de changement d'état |
| T06 | ['ON'] * 256 | [('ON',256)] | limite arbitraire de compteur ; ce pilote n'impose pas de format binaire sur un octet |
| T07 | ['ON','OFF'] | [('ON',1),('OFF',1)] | confusion effectif / indice |

## Validation pédagogique
- Une sortie Python sans exception n'est pas une validation de T01–T07.
- Le tuteur pose une question adaptée à l'erreur observée, sans insérer la solution.
- Le mode élève affiche les résultats de ses essais et les indices, pas le corrigé enseignant.
- Après réussite, demander : « Pourquoi la même valeur peut-elle apparaître dans plusieurs couples distincts ? »
- Vérifier que la liste initiale n'a pas été modifiée et que la sortie est une liste de tuples.

## Vérification des sources
- Fiche pédagogique enseignant : https://darksathili-jpg.github.io/pratique_2026/sujet_1/fiche_rle_nsi_light.html
- Banque nationale pratique 2026 (23 sujets) : https://sti.eduscol.education.fr/concours_examens/epreuve-pratique-bac-specialite-numerique-et-sciences-informatiques-2026
- Exigence officielle de non-reprise telle quelle : https://sti.eduscol.education.fr/actualites/extrait-bo-ndeg46-du-4-decembre-2025

## Prochaines portes
G1 : revue du corpus exact et de la consigne ; G2 : implémentation de la mission et des tests ; G3 : vérification indépendante ; G4 : recette enseignant ; G5 : publication INTERDITE sans autorisation explicite.