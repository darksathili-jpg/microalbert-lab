const {test,expect}=require('@playwright/test');
test.beforeEach(async({page})=>{await page.goto('http://127.0.0.1:5173/');});
test('G4-P5-B : sortie Python locale',async({page})=>{
 await page.locator('#lab-code').fill('print(2 + 3)');
 await page.getByRole('button',{name:'Exécuter le code'}).click();
 await expect(page.getByText('Exécution terminée', {exact:true})).toBeVisible({timeout:30000});
 await expect(page.locator('.python-runner-output')).toContainText('5');
});
test('G4-P5-B : erreur Python explicite',async({page})=>{
 await page.locator('#lab-code').fill('print(1 / 0)');
 await page.getByRole('button',{name:'Exécuter le code'}).click();
 await expect(page.getByText('Exécution en erreur')).toBeVisible({timeout:30000});
 await expect(page.locator('.python-runner-output')).toContainText('ZeroDivisionError');
});
test('G4-P5-B : boucle infinie arrêtée au délai et relance possible',async({page})=>{
 // Deux démarrages de Pyodide et un délai Python de 8 s : le budget global de 15 s est insuffisant.
 test.setTimeout(45000);
 await page.locator('#lab-code').fill('while True:\n    pass');
 await page.getByRole('button',{name:'Exécuter le code'}).click();
 await expect(page.getByText('Délai dépassé')).toBeVisible({timeout:15000});
 await page.locator('#lab-code').fill('print(9)');
 await page.getByRole('button',{name:'Exécuter le code'}).click();
 await expect(page.getByText('Exécution terminée', {exact:true})).toBeVisible({timeout:30000});
 await expect(page.locator('.python-runner-output')).toContainText('9');
});
test('G4-P5-B : annulation ne publie pas de sortie tardive',async({page})=>{
 await page.locator('#lab-code').fill('while True:\n    pass');
 await page.getByRole('button',{name:'Exécuter le code'}).click();
 await page.getByRole('button',{name:'Arrêter l’exécution'}).click();
 await expect(page.getByText('Exécution arrêtée',{exact:true})).toBeVisible();
 await expect(page.locator('.python-runner-output')).not.toContainText('9');
});
