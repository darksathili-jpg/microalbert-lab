const {test,expect}=require('@playwright/test');

test('G4-INFRA-01 : Python local et trois modes d’affichage',async({page})=>{
 test.setTimeout(60000);
 await page.goto('http://127.0.0.1:5179/');
 for(const [value] of [['light'],['dark'],['projector']]){
  await page.getByLabel('Affichage :').selectOption(value);
  await expect(page.locator('.app')).toHaveAttribute('data-theme',value);
 }
 await page.getByLabel('Affichage :').selectOption('light');
 await expect(page.getByRole('heading',{name:'Mission Terminale NSI · Une file de messages'})).toBeVisible();
 await page.getByRole('button',{name:'Exécuter le code'}).first().click();
 await expect(page.getByRole('status').filter({hasText:'Exécution terminée'})).toBeVisible({timeout:30000});
});
