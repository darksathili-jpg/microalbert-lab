const {test,expect}=require('@playwright/test');
test('G4 public : interface, trois thèmes et moteur Python réellement exécuté',async({page})=>{
 test.setTimeout(90000);
 const browserErrors=[];
 page.on('pageerror',error=>browserErrors.push('PAGE: '+error.message));
 page.on('console',message=>{if(message.type()==='error')browserErrors.push('CONSOLE: '+message.text());});
 page.on('response',response=>{if(response.status()>=400)browserErrors.push('HTTP '+response.status()+' '+response.url());});
 const response=await page.goto('http://127.0.0.1:5180/microalbert-lab/',{waitUntil:'networkidle'});
 try {
  await expect(page.locator('#student-heading')).toBeVisible({timeout:15000});
 } catch(error) {
  const html=await page.locator('body').innerText().catch(()=>'<body inaccessible>');
  console.error('DIAGNOSTIC G4 PUBLIC — HTTP:',response?.status(),'URL:',page.url());
  console.error('DIAGNOSTIC G4 PUBLIC — HTML:',html.slice(0,3000));
  console.error('DIAGNOSTIC G4 PUBLIC — ERREURS:',browserErrors.join('\\n'));
  await page.screenshot({path:'test-results/g4-public-page-failure.png',fullPage:true}).catch(()=>{});
  throw error;
 }
 await expect(page.getByText('Illustration indisponible.')).toHaveCount(0);
 await expect(page.locator('.stage--no-illustration')).toHaveCount(0);
 const mascot=page.locator('.mascot-panel img');
 await expect(mascot).toBeVisible();
 await expect.poll(()=>mascot.evaluate(img=>img.complete && img.naturalWidth>0)).toBe(true);
 const desktopStage=await page.locator('.stage').boundingBox();
 const desktopMascot=await page.locator('.mascot-panel').boundingBox();
 expect(desktopMascot.width).toBeLessThan(desktopStage.width*0.35);
 expect(desktopStage.width).toBeGreaterThan(800);
 await page.setViewportSize({width:390,height:844});
 await expect(page.locator('#student-heading')).toBeVisible();
 const mobileStage=await page.locator('.stage').boundingBox();
 const mobileMascot=await page.locator('.mascot-panel').boundingBox();
 expect(mobileMascot.width).toBeLessThanOrEqual(mobileStage.width);
 await page.setViewportSize({width:1280,height:800});
 for(const theme of ['light','dark','projector']){
  await page.getByLabel('Affichage :').selectOption(theme);
  await expect(page.locator('.app')).toHaveAttribute('data-theme',theme);
 }
 await page.getByLabel('Affichage :').selectOption('light');
 await expect(page.getByText('Mode guidé local :')).toBeVisible();
 await page.getByLabel('Ma question au tuteur').fill('Comment vérifier ma file ?');
 await page.getByRole('button',{name:'Envoyer ma question'}).click();
 await expect(page.getByRole('log',{name:'Échanges avec le tuteur'})).toContainText('Comment vérifier ma file ?');
 await expect(page.getByRole('log',{name:'Échanges avec le tuteur'})).toContainText('trois valeurs distinctes');
 await page.getByRole('button',{name:'Effacer les échanges'}).click();
 await expect(page.getByRole('log',{name:'Échanges avec le tuteur'})).not.toContainText('Comment vérifier ma file ?');
 const editor=page.getByRole('textbox',{name:/Code Python, édition au clavier/});
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
