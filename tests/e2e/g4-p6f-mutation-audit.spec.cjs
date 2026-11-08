const {test,expect}=require('@playwright/test');
const mutants=[
 {name:'fusion de plages non consécutives',source:`def regrouper(etats):
    return [(etat, etats.count(etat)) for etat in dict.fromkeys(etats)]`,case:'Plages séparées'},
 {name:'oubli de la dernière plage',source:`def regrouper(etats):
    if not etats:
        return []
    resultat = []
    courant, effectif = etats[0], 1
    for etat in etats[1:]:
        if etat == courant:
            effectif += 1
        else:
            resultat.append((courant, effectif))
            courant, effectif = etat, 1
    return resultat`,case:'Une valeur'},
 {name:'modification de la liste reçue',source:`def regrouper(etats):
    resultat = []
    if etats:
        courant, effectif = etats[0], 1
        for etat in etats[1:]:
            if etat == courant:
                effectif += 1
            else:
                resultat.append((courant, effectif))
                courant, effectif = etat, 1
        resultat.append((courant, effectif))
    etats.clear()
    return resultat`,case:'Une valeur'},
 {name:'retour sous forme de listes au lieu de tuples',source:`def regrouper(etats):
    if not etats:
        return []
    resultat = []
    courant, effectif = etats[0], 1
    for etat in etats[1:]:
        if etat == courant:
            effectif += 1
        else:
            resultat.append([courant, effectif])
            courant, effectif = etat, 1
    resultat.append([courant, effectif])
    return resultat`,case:'Une valeur'}
];
test.beforeEach(async({page})=>{
 await page.goto('http://127.0.0.1:5173/');
 await page.getByRole('group',{name:'Choisir une mission'}).getByRole('button',{name:'Balises lumineuses'}).click();
});
for(const mutant of mutants){
 test('G4-P6-F : mutation détectée — '+mutant.name,async({page})=>{
  await page.locator('#balises-code').fill(mutant.source);
  await page.getByRole('button',{name:'Mes tests'}).click();
  await page.getByRole('button',{name:'Exécuter le code'}).click();
  const results=page.getByRole('region',{name:'Résultats des tests publics'});
  await expect(results).toBeVisible({timeout:30000});
  await expect(results.getByText(mutant.case+' : écart observé')).toBeVisible();
  await expect(results).not.toContainText('mission validée');
 });
}
