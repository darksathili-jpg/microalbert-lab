const {test,expect}=require('@playwright/test');
test.beforeEach(async ({page})=>{await page.goto('http://127.0.0.1:5173/');});
test('G4-P5-A : éditeur accessible, numéros et coloration',async({page})=>{
 const editor=page.locator('#lab-code');
 await expect(editor).toBeVisible();
 await expect(page.locator('.python-editor-gutter')).toContainText('1');
 await expect(page.locator('.python-editor-highlight .token-keyword').first()).toHaveText('def');
 await expect(editor).toHaveAttribute('aria-label',/Tab pour indenter/);
});
test('G4-P5-A : tabulation et entrée conservent le code',async({page})=>{
 const editor=page.locator('#lab-code');
 await editor.fill('def exemple():');
 await editor.press('End');
 await editor.press('Enter');
 await editor.press('Tab');
 await expect(editor).toHaveValue('def exemple():\n        ');
 await page.getByRole('button',{name:'Mes tests'}).click();
 await page.getByRole('button',{name:'Code Python'}).click();
 await expect(editor).toHaveValue('def exemple():\n        ');
});
test('G4-P5-A : modes de contraste et saisie préservée',async({page})=>{
 const editor=page.locator('#lab-code');
 await editor.fill('print(42)');
 for(const theme of ['light','dark','projector']){
  await page.getByLabel('Affichage :').selectOption(theme);
  await expect(page.locator('.app')).toHaveAttribute('data-theme',theme);
  await expect(editor).toHaveValue('print(42)');
  const fg=await page.locator('.python-editor').evaluate(el=>getComputedStyle(el).getPropertyValue('--editor-fg').trim());
  expect(fg).toBeTruthy();
 }
});
