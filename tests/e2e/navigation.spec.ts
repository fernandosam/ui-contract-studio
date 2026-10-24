import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
test('navegação ReUI, blocos restantes e alternância de tema',async({page,isMobile})=>{
 await page.goto('/?screen=reui');
 await expect(page.getByRole('heading',{name:'ReUI',exact:true})).toBeVisible();
 if(isMobile)await page.getByRole('button',{name:'Alternar navegação'}).click();
 for(const label of ['ReUI','Login','Cadastro','Sidebars'])await expect(page.getByRole('link',{name:label,exact:true})).toBeVisible();
 for(const label of ['Galeria 1','Galeria 2','Dashboard'])await expect(page.getByRole('link',{name:label,exact:true})).toHaveCount(0);
 if(isMobile)await page.keyboard.press('Escape');
 await page.getByRole('button',{name:'Ativar tema claro'}).click();
 await expect(page.locator('html')).toHaveClass(/light-theme/);
 if(isMobile)await page.getByRole('button',{name:'Alternar navegação'}).click();
 await page.getByRole('link',{name:'Login',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Login',exact:true})).toBeVisible();
});
test('ReUI mantém acessibilidade crítica',async({page})=>{
 await page.goto('/?screen=reui');
 const result=await new AxeBuilder({page}).analyze();
 expect(result.violations.filter(v=>v.impact==='critical')).toEqual([]);
});
