const {test,expect}=require('@playwright/test');

// Lancer avec VITE_STUDENT_STAGING=true au démarrage de Vite.
// Sans cette variable, le test n'affirme rien sur le mode normal.
test('G4-P6-J : interface pilote élèves sans espaces techniques',async({page})=>{

 await page.goto('http://127.0.0.1:5173/');
 await expect(page.getByRole('heading',{name:'Espace Élève'})).toBeVisible();
 await expect(page.getByText('Pilote élèves — non certifié')).toBeVisible();
 await expect(page.getByRole('button',{name:'Enseignant',exact:true})).toHaveCount(0);
 await expect(page.getByRole('button',{name:'Audit',exact:true})).toHaveCount(0);
 await expect(page.getByRole('button',{name:'Interroger le simulateur'})).toHaveCount(0);
 await expect(page.getByRole('button',{name:'Balises lumineuses'})).toBeVisible();
 await page.getByRole('button',{name:'Balises lumineuses'}).click();
 await expect(page.getByRole('heading',{name:'Mission Terminale NSI · Balises lumineuses'})).toBeVisible();
});
