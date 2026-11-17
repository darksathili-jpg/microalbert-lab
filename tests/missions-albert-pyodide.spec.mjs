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

test('Pyodide indisponible : repli automatique sur le moteur guidé',async ({page})=>{
 await page.evaluate(()=>{
  const NativeWorker=window.Worker;
  window.Worker=class extends NativeWorker{
   constructor(url,options){
    if(String(url).includes('python-missions-worker'))throw Error('Simulation : Pyodide inaccessible');
    super(url,options);
   }
  };
 });
 await page.locator('#program').fill('albert.avancer()');
 await page.locator('#run').click();
 await expect(page.locator('#execution-mode')).toHaveValue('guided');
 await expect(page.locator('#python-console')).toContainText('Reprise avec');
 await expect(page.locator('#feedback')).toContainText(/Mission réussie/i,{timeout:15000});
});

test('Erreur Python : ne jamais basculer vers le moteur pédagogique',async ({page})=>{
 await page.evaluate(()=>{
  const NativeWorker=window.Worker;
  window.Worker=class {
   onmessage=null;
   onerror=null;
   constructor(url){
    if(!String(url).includes('python-missions-worker'))return new NativeWorker(url);
   }
   postMessage(message){
    if(message.type==='init')queueMicrotask(()=>this.onmessage?.({data:{type:'ready'}}));
    if(message.type==='run')queueMicrotask(()=>this.onmessage?.({data:{id:message.id,error:'NameError: variable inconnue'}}));
   }
   terminate(){}
  };
 });
 await page.locator('#program').fill('variable_inconnue');
 await page.locator('#run').click();
 await expect(page.locator('#feedback')).toContainText('NameError');
 await expect(page.locator('#execution-mode')).toHaveValue('python');
});

test('Boucle infinie : arrêt du moteur après le délai de sécurité',async ({page})=>{
 test.setTimeout(20000);
 await page.evaluate(()=>{
  const NativeWorker=window.Worker;
  window.Worker=class {
   onmessage=null;
   onerror=null;
   constructor(url){
    if(!String(url).includes('python-missions-worker'))return new NativeWorker(url);
   }
   postMessage(message){
    if(message.type==='init')queueMicrotask(()=>this.onmessage?.({data:{type:'ready'}}));
    // Simule une exécution bloquée : le worker ne répond jamais.
   }
   terminate(){}
  };
 });
 await page.locator('#program').fill('while True:\\n    pass');
 await page.locator('#run').click();
 await expect(page.locator('#feedback')).toContainText(/interrompue après 8 secondes/i,{timeout:12000});
 await expect(page.locator('#execution-mode')).toHaveValue('python');
});
