const {test,expect}=require('@playwright/test');
test.beforeEach(async({page})=>{
 await page.goto('http://127.0.0.1:5173/');
 await page.getByRole('group',{name:'Choisir une mission'}).getByRole('button',{name:'Balises lumineuses'}).click();
});
test('G4-P6-E : un programme incorrect produit des écarts sans certification',async({page})=>{
 await page.locator('#balises-code').fill('def regrouper(etats):\n    return []');
 await page.getByRole('button',{name:'Mes tests'}).click();
 await page.getByRole('button',{name:'Exécuter le code'}).click();
 await expect(page.getByRole('region',{name:'Résultats des tests publics'})).toBeVisible({timeout:30000});
 const results=page.getByRole('region',{name:'Résultats des tests publics'});
 await expect(results).toContainText('Liste vide : résultat conforme au cas testé');
 await expect(results).toContainText('Une valeur : écart observé');
 await expect(results).toContainText('non certificative');
});
test('G4-P6-E : une erreur de fonction ne déclenche aucune validation',async({page})=>{
 await page.locator('#balises-code').fill('def regrouper(etats):\n    raise ValueError("essai")');
 await page.getByRole('button',{name:'Mes tests'}).click();
 await page.getByRole('button',{name:'Exécuter le code'}).click();
 await expect(page.getByRole('region',{name:'Résultats des tests publics'})).toBeVisible({timeout:30000});
 await expect(page.getByRole('region',{name:'Résultats des tests publics'})).toContainText('écart observé');
 await expect(page.getByRole('region',{name:'Résultats des tests publics'})).not.toContainText('mission validée');
});
