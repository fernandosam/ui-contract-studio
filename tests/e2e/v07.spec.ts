import {test,expect} from '@playwright/test';
test('screens e metadata descobertos automaticamente',async({page})=>{
 await page.goto('/?screen=blocos-dashboard');
 await expect(page.getByRole('heading',{name:'Dashboard',exact:true})).toBeVisible();
 if (page.viewportSize() && page.viewportSize()!.width < 768) await page.getByRole('button',{name:'Alternar navegação'}).click();
 await expect(page.getByRole('link',{name:'Galeria 1'})).toBeVisible();
});
test('telas removidas não são exibidas na navegação',async({page})=>{
 await page.goto('/?screen=auditoria');
 await expect(page.getByRole('heading',{name:'Galeria 1'})).toBeVisible();
 for(const name of ['Visão geral','Gerenciamento de usuários','Catálogo de componentes','Vitrine de componentes','Extensões aprovadas','Auditoria']){
  await expect(page.getByRole('link',{name,exact:true})).toHaveCount(0);
 }
});
