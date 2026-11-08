"""G4-P6-C: tests de comportement enseignants, hors application élève.

Exécuter : python -m unittest discover -s tests/pedagogie -p "test_balises.py" -v
Ce fichier contient une implémentation témoin de validation et une mutation
intentionnellement fautive ; il n'est jamais importé dans frontend/src.
"""
import unittest


def regrouper_reference(etats):
    """Implémentation témoin de recette, réservée aux tests enseignants."""
    if not etats:
        return []
    resultat = []
    courant = etats[0]
    effectif = 1
    for etat in etats[1:]:
        if etat == courant:
            effectif += 1
        else:
            resultat.append((courant, effectif))
            courant, effectif = etat, 1
    resultat.append((courant, effectif))
    return resultat


def regrouper_mutation(etats):
    """Mutation volontaire : rassemble toutes les valeurs identiques,
    même si elles ne sont pas consécutives."""
    return [(etat, etats.count(etat)) for etat in dict.fromkeys(etats)]


CAS = [
    ("vide", [], []),
    ("singleton", ["ON"], [("ON", 1)]),
    ("plage_unique", ["ON"] * 3, [("ON", 3)]),
    ("alternance", ["OFF", "ON", "OFF"],
     [("OFF", 1), ("ON", 1), ("OFF", 1)]),
    ("plages", ["ON", "ON", "OFF", "OFF", "ON"],
     [("ON", 2), ("OFF", 2), ("ON", 1)]),
    ("longue_plage", ["ON"] * 256, [("ON", 256)]),
    ("deux_etats", ["ON", "OFF"], [("ON", 1), ("OFF", 1)]),
]


class TestBalises(unittest.TestCase):
    def test_reference_sur_sept_cas(self):
        for nom, entree, attendu in CAS:
            with self.subTest(cas=nom):
                copie = entree.copy()
                self.assertEqual(regrouper_reference(entree), attendu)
                self.assertEqual(entree, copie, "L'entrée ne doit pas être modifiée.")

    def test_mutation_detectee_par_contre_exemple(self):
        entree = ["OFF", "ON", "OFF"]
        self.assertNotEqual(regrouper_mutation(entree),
                            [("OFF", 1), ("ON", 1), ("OFF", 1)])

    def test_structure_des_couples(self):
        for nom, entree, _ in CAS:
            with self.subTest(cas=nom):
                resultat = regrouper_reference(entree)
                self.assertIsInstance(resultat, list)
                self.assertTrue(all(isinstance(c, tuple) and len(c) == 2
                                    and isinstance(c[1], int) and c[1] > 0
                                    for c in resultat))


if __name__ == "__main__":
    unittest.main()
