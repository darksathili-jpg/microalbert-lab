const {test,expect}=require('@playwright/test');
test.beforeEach(async({page})=>{
 await page.goto('http://127.0.0.1:5173/');
 await page.getByRole('group',{name:'Choisir une mission'}).getByRole('button',{name:'Balises lumineuses'}).click();
});
test('G4-P6-C : programme incorrect mais exécution réussie ne certifie pas la mission',async({page})=>{
 await page.locator('#balises-code').fill('def regrouper(etats):\n    return []\n\nprint(regrouper(["ON"]))');
 await page.getByRole('button',{name:'Exécuter le code'}).click();
 await expect(page.getByText('Exécution terminée',{exact:true})).toBeVisible({timeout:30000});
 await expect(page.locator('.python-runner-output')).toContainText('[]');
 await expect(page.getByText('Ce retour ne certifie pas la correction de ton programme.')).toBeVisible();
 await expect(page.getByText('mission validée',{exact:false})).toHaveCount(0);
});
test('G4-P6-C : erreur Python conduit à une question et non à un corrigé',async({page})=>{
 await page.locator('#balises-code').fill('def regrouper(etats):\n    return etats[0]\n\nprint(regrouper([]))');
 await page.getByRole('button',{name:'Exécuter le code'}).click();
 await expect(page.getByText('Exécution en erreur',{exact:true})).toBeVisible({timeout:30000});
 await expect(page.locator('.python-runner-output')).toContainText('IndexError');
 await expect(page.getByRole('complementary',{name:'Retour pédagogique après exécution'})).toContainText('Ton programme traite-t-il ce cas ?');
});
