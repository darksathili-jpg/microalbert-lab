const {test,expect}=require('@playwright/test');
test.beforeEach(async({page})=>{await page.goto('http://127.0.0.1:5173/');});
test('G4-P6-B : mission File préservée par défaut',async({page})=>{
 await expect(page.getByRole('heading',{name:'Mission Terminale NSI · Une file de messages'})).toBeVisible();
 await expect(page.locator('#lab-code')).toBeVisible();
});
test('G4-P6-B : mission Balises et exemples disponibles',async({page})=>{
 await page.getByRole('group',{name:'Choisir une mission'}).getByRole('button',{name:'Balises lumineuses'}).click();
 await expect(page.getByRole('heading',{name:'Mission Terminale NSI · Balises lumineuses'})).toBeVisible();
 await expect(page.locator('#balises-code')).toBeVisible();
 await page.getByRole('group',{name:'Outils Balises lumineuses'}).getByRole('button',{name:'Mes tests'}).click();
 await expect(page.locator('.lab-examples').filter({hasText:'print(regrouper([]))'}).first()).toBeVisible();
});
test('G4-P6-B : indices gradués et absence de corrigé',async({page})=>{
 await page.getByRole('group',{name:'Choisir une mission'}).getByRole('button',{name:'Balises lumineuses'}).click();
 for(let n=3;n>=1;n--){
  await page.getByRole('button',{name:`Demander un indice (${n} restants)`}).click();
 }
 await expect(page.getByRole('button',{name:'Demander un indice (0 restants)'})).toBeDisabled();
 await expect(page.locator('#balises-code')).toHaveValue(/pass/);
});
test('G4-P6-B : retour à la mission File sans perte de sa saisie',async({page})=>{
 await page.locator('#lab-code').fill('print(123)');
 await page.getByRole('group',{name:'Choisir une mission'}).getByRole('button',{name:'Balises lumineuses'}).click();
 await page.getByRole('group',{name:'Choisir une mission'}).getByRole('button',{name:'File de messages'}).click();
 await expect(page.locator('#lab-code')).toHaveValue('print(123)');
});
