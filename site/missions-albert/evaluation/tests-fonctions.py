# Évaluation pédagogique dans le même environnement Python que le programme élève.
# Les tests utilisent des entrées différentes et ne se contentent pas d'une exécution sans erreur.
import json
def _albert_eval():
    evaluations = {
      8: ("Fonction doubler", lambda: [
        (doubler(0) == 0, "Cas zéro"),
        (doubler(7) == 14, "Entier positif"),
        (doubler(-3) == -6, "Entier négatif")]),
      9: ("Fonction est_pair", lambda: [
        (est_pair(0) is True, "Cas zéro"),
        (est_pair(9) is False, "Entier impair"),
        (est_pair(-4) is True, "Entier négatif pair")]),
      15: ("Fonction aire_rectangle", lambda: [
        (aire_rectangle(4, 3) == 12, "Rectangle"),
        (aire_rectangle(0, 8) == 0, "Dimension nulle"),
        (aire_rectangle(2.5, 4) == 10, "Dimensions non entières")]),
      16: ("Fonction longueur", lambda: [
        (longueur([]) == 0, "Liste vide"),
        (longueur([8]) == 1, "Un élément"),
        (longueur([1,2,3]) == 3, "Trois éléments")]),
      17: ("Fonction compter_alertes", lambda: [
        (compter_alertes([12,18,9,21,15],16) == 2, "Mesures variées"),
        (compter_alertes([],16) == 0, "Liste vide"),
        (compter_alertes([16,16,15],16) == 2, "Seuil inclus")])
    }
    if __albert_lesson not in evaluations:
        return {"supported":False,"message":"Cette activité est en mode exploration ; aucune validation automatique n'est encore disponible."}
    name, checks = evaluations[__albert_lesson]
    results=[]
    for test in checks():
        ok,label=test
        results.append({"label":label,"ok":bool(ok)})
    return {"supported":True,"name":name,"passed":sum(item["ok"] for item in results),
            "total":len(results),"checks":results}

print("__ALBERT_EVAL__"+json.dumps(_albert_eval(),ensure_ascii=False))
