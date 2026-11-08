const {test,expect}=require('@playwright/test');
test.beforeEach(async({page})=>{await page.goto('http://127.0.0.1:5173/');await page.getByRole('group',{name:'Choisir une mission'}).getByRole('button',{name:'Balises lumineuses'}).click();await page.getByRole('group',{name:'Outils Balises lumineuses'}).getByRole('button',{name:'Mes tests'}).click();});
test('G4-P6-C : le résultat attendu nécessite une prédiction',async({page})=>{
 const caseBox=page.locator('.lab-test-case').filter({has:page.getByRole('heading',{name:'Liste vide'})});
 await expect(caseBox.getByRole('button',{name:'Comparer avec le résultat attendu'})).toBeDisabled();
 await expect(caseBox.getByText('Résultat attendu :')).toHaveCount(0);
 await caseBox.getByRole('textbox',{name:'Résultat que tu prévois'}).fill('[]');
 await caseBox.getByRole('button',{name:'Comparer avec le résultat attendu'}).click();
 await expect(caseBox.getByText('Résultat attendu :')).toBeVisible();
 await expect(caseBox.getByText('Question du tuteur :')).toBeVisible();
});
test('G4-P6-C : quatre cas indépendants et aucune certification automatique',async({page})=>{
 await expect(page.locator('.lab-test-case')).toHaveCount(4);
 await expect(page.getByText('Ces comparaisons ne lancent pas ton programme',{exact:false})).toBeVisible();
 const caseBox=page.locator('.lab-test-case').filter({has:page.getByRole('heading',{name:'Valeurs non consécutives'})});
 await caseBox.getByRole('textbox',{name:'Résultat que tu prévois'}).fill("[('OFF', 2), ('ON', 1)]");
 await caseBox.getByRole('button',{name:'Comparer avec le résultat attendu'}).click();
 await expect(caseBox.getByText("('OFF', 1), ('ON', 1), ('OFF', 1)",{exact:false})).toBeVisible();
 await expect(page.locator('.lab-test-case').filter({has:page.getByRole('heading',{name:'Plage longue'})}).getByRole('button',{name:'Comparer avec le résultat attendu'})).toBeDisabled();
});
