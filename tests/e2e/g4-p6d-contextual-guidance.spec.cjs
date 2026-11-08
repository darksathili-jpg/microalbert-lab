const {test,expect}=require('@playwright/test');
test.beforeEach(async({page})=>{await page.goto('http://127.0.0.1:5173/');});
test('G4-P6-D : succès Balises donne une question sur les plages',async({page})=>{
 await page.getByRole('group',{name:'Choisir une mission'}).getByRole('button',{name:'Balises lumineuses'}).click();
 await page.locator('#balises-code').fill('def regrouper(etats):\n    return []\n\nprint(regrouper(["ON"]))');
 await page.getByRole('button',{name:'Exécuter le code'}).click();
 await expect(page.getByText('Exécution terminée',{exact:true})).toBeVisible({timeout:30000});
 const guidance=page.getByRole('complementary',{name:'Retour pédagogique après exécution'});
 await expect(guidance).toContainText('deux plages séparées');
 await expect(guidance).not.toContainText('file vide');
 await expect(guidance).toContainText('ne certifie pas la correction');
});
test('G4-P6-D : succès File conserve son diagnostic spécifique',async({page})=>{
 await page.locator('#lab-code').fill('print(3)');
 await page.getByRole('button',{name:'Exécuter le code'}).click();
 await expect(page.getByText('Exécution terminée',{exact:true})).toBeVisible({timeout:30000});
 const guidance=page.getByRole('complementary',{name:'Retour pédagogique après exécution'});
 await expect(guidance).toContainText('file vide');
 await expect(guidance).not.toContainText('deux plages séparées');
});
