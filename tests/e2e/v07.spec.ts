import {test,expect} from '@playwright/test';
test('ReUI é a tela padrão e os blocos restantes são descobertos por metadata',async({page})=>{
 await page.goto('/');
 await expect(page.getByRole('heading',{name:'ReUI',exact:true})).toBeVisible();
 if(page.viewportSize() && page.viewportSize()!.width<768)await page.getByRole('button',{name:'Alternar navegação'}).click();
 await expect(page.getByRole('link',{name:'Login'})).toBeVisible();
 await expect(page.getByRole('link',{name:'Dashboard'})).toHaveCount(0);
});
test('rotas removidas retornam à ReUI',async({page})=>{
 await page.goto('/?screen=exemplo-01');
 await expect(page.getByRole('heading',{name:'ReUI',exact:true})).toBeVisible();
 for(const name of ['Galeria 1','Galeria 2','Dashboard','Visão geral','Auditoria']){
  await expect(page.getByRole('link',{name,exact:true})).toHaveCount(0);
 }
});
