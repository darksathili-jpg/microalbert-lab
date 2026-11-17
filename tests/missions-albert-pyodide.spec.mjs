import { test, expect } from '@playwright/test';

test.beforeEach(async ({page})=>{
 await page.goto('missions-albert/index.html');
});

test('Pyodide est le moteur par défaut et le catalogue reste fermé',async ({page})=>{
 await expect(page.locator('#execution-mode')).toHaveValue('python');
 await expect(page.locator('#catalogue-actions')).not.toHaveAttribute('open',/.+/);
 await expect(page.locator('#catalogue-all')).not.toBeChecked();
});

test('insertion de boucle : vrais retours à la ligne, sans séquence littérale',async ({page})=>{
 await page.locator('#catalogue-actions summary').click();
 await page.locator('#catalogue-all').check();
 const forCard=page.locator('.catalogue-item').filter({hasText:'for i in range(3):'}).first();
 await forCard.getByRole('button',{name:/insérer/i}).click();
 const value=await page.locator('#program').inputValue();
 expect(value).toContain('for i in range(3):\n    albert.avancer()');
 expect(value).not.toContain('\\n');
});

test('mode guidé : déplacement et validation de la première mission',async ({page})=>{
 await page.locator('#execution-mode').selectOption('guided');
 await page.locator('#mission-select').selectOption('0');
 await page.locator('#program').fill('albert.avancer()');
 await page.locator('#run').click();
 await expect(page.locator('#feedback')).toContainText(/Mission réussie/i,{timeout:15000});
});

test('mode guidé : erreur de syntaxe expliquée',async ({page})=>{
 await page.locator('#execution-mode').selectOption('guided');
 await page.locator('#program').fill('print("Bonjour")');
 await page.locator('#run').click();
 await expect(page.locator('#feedback')).toContainText(/Instruction non reconnue/i);
});
