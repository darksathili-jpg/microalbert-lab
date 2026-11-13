const {test,expect}=require('@playwright/test');
test('G4 public : interface, trois thèmes et moteur Python réellement exécuté',async({page})=>{
 test.setTimeout(90000);
 await page.goto('http://127.0.0.1:5180/microalbert-lab/');
 await expect(page.getByRole('heading',{name:'Espace Élève'})).toBeVisible();
 await expect(page.getByText('Illustration indisponible.')).toHaveCount(0);
 for(const theme of ['light','dark','projector']){
  await page.getByLabel('Affichage :').selectOption(theme);
  await expect(page.locator('.app')).toHaveAttribute('data-theme',theme);
 }
 await page.getByLabel('Affichage :').selectOption('light');
 const editor=page.getByLabel('Éditeur Python — ton programme');
 await expect(editor).toBeVisible();
 await editor.fill('print(2 + 3)');
 await page.getByRole('button',{name:'Exécuter le code'}).first().click();
 await expect(page.getByRole('status').filter({hasText:'Exécution terminée'})).toBeVisible({timeout:40000});
 await expect(page.getByLabel('Résultats de l’exécution')).toContainText('5');
 await editor.fill('print(1 / 0)');
 await page.getByRole('button',{name:'Exécuter le code'}).first().click();
 await expect(page.getByRole('status').filter({hasText:'Exécution en erreur'})).toBeVisible({timeout:40000});
 await editor.fill('while True:\n    pass');
 await page.getByRole('button',{name:'Exécuter le code'}).first().click();
 await page.getByRole('button',{name:'Arrêter l’exécution'}).click();
 await expect(page.getByRole('status').filter({hasText:'Exécution arrêtée'})).toBeVisible();
});
