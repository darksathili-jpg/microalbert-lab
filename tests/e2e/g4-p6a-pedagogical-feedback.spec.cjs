const {test,expect}=require('@playwright/test');
test.beforeEach(async({page})=>page.goto('http://127.0.0.1:5173/'));
test('G4-P6-A: success is not presented as mission correctness',async({page})=>{
 await page.locator('#lab-code').fill('print(5)');
 await page.getByRole('button',{name:'Exécuter le code'}).click();
 await expect(page.getByRole('heading',{name:/Retour du tuteur · Exécution terminée sans exception/})).toBeVisible({timeout:30000});
 await expect(page.getByText('Ce retour ne certifie pas la correction de ton programme.')).toBeVisible();
});
test('G4-P6-A: syntax error prompts diagnosis without solution',async({page})=>{
 await page.locator('#lab-code').fill('def test(');
 await page.getByRole('button',{name:'Exécuter le code'}).click();
 await expect(page.getByRole('heading',{name:/Erreur de syntaxe ou d’indentation/})).toBeVisible({timeout:30000});
 await expect(page.locator('.python-pedagogical-guidance')).not.toContainText('def enfiler(');
});
test('G4-P6-A: changing code and rerunning clears old feedback',async({page})=>{
 await page.locator('#lab-code').fill('print(1/0)');
 await page.getByRole('button',{name:'Exécuter le code'}).click();
 await expect(page.getByRole('heading',{name:/Division par zéro/})).toBeVisible({timeout:30000});
 await page.locator('#lab-code').fill('print(3)');
 await page.getByRole('button',{name:'Exécuter le code'}).click();
 await expect(page.getByRole('heading',{name:/Exécution terminée sans exception/})).toBeVisible({timeout:30000});
 await expect(page.locator('.python-pedagogical-guidance')).not.toContainText('Division par zéro');
});
