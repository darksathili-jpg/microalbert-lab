# Tests pédagogiques : chaque cas est évalué séparément.
# Le résultat ne vaut pas certification de maîtrise.
import json
def _albert_eval():
    specs={
      8: ("Fonction doubler", [
        ("Zéro",lambda: doubler(0)==0),
        ("Positif",lambda: doubler(7)==14),
        ("Négatif",lambda: doubler(-3)==-6)]),
      9: ("Fonction est_pair", [
        ("Zéro",lambda: est_pair(0) is True),
        ("Impair",lambda: est_pair(9) is False),
        ("Négatif pair",lambda: est_pair(-4) is True)]),
      15: ("Fonction aire_rectangle", [
        ("Rectangle",lambda: aire_rectangle(4,3)==12),
        ("Dimension nulle",lambda: aire_rectangle(0,8)==0),
        ("Dimensions décimales",lambda: aire_rectangle(2.5,4)==10)]),
      16: ("Fonction longueur", [
        ("Liste vide",lambda: longueur([])==0),
        ("Un élément",lambda: longueur([8])==1),
        ("Trois éléments",lambda: longueur([1,2,3])==3)]),
      17: ("Fonction compter_alertes", [
        ("Mesures variées",lambda: compter_alertes([12,18,9,21,15],16)==2),
        ("Liste vide",lambda: compter_alertes([],16)==0),
        ("Seuil inclus",lambda: compter_alertes([16,16,15],16)==2)])
    }
    if __albert_lesson not in specs:
        return {"supported":False,"message":"Cette activité est en mode exploration ; validation automatique à venir."}
    name,tests=specs[__albert_lesson]
    checks=[]
    for label,test in tests:
        try:
            ok=bool(test())
            checks.append({"label":label,"ok":ok})
        except Exception as error:
            checks.append({"label":label,"ok":False,"diagnostic":type(error).__name__})
    return {"supported":True,"name":name,"passed":sum(x["ok"] for x in checks),
            "total":len(checks),"checks":checks}
print("__ALBERT_EVAL__"+json.dumps(_albert_eval(),ensure_ascii=False))
