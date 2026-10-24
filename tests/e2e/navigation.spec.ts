import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
test('grupos de navegação, tema e páginas ativas',async({page,isMobile})=>{
 await page.goto('/?screen=exemplo-01');
 await expect(page.getByRole('heading',{name:'Galeria 1'})).toBeVisible();
 if(isMobile) await page.getByRole('button',{name:'Alternar navegação'}).click();
 await expect(page.getByText('Blocos shadcn',{exact:true})).toBeVisible();
 for(const label of ['Dashboard','Login','Cadastro','Sidebars']) await expect(page.getByRole('link',{name:label,exact:true})).toBeVisible();
 await expect(page.getByRole('link',{name:'Galeria 2'})).toBeVisible();
 if(isMobile) await page.keyboard.press('Escape');
 await page.getByRole('button',{name:'Ativar tema claro'}).click();
 await expect(page.locator('html')).toHaveClass(/light-theme/);
 if(isMobile) await page.getByRole('button',{name:'Alternar navegação'}).click();
 await page.getByRole('link',{name:'Login',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Login',exact:true})).toBeVisible();
});
test('galeria mantém acessibilidade crítica',async({page})=>{
 await page.goto('/?screen=exemplo-02');
 const result=await new AxeBuilder({page}).analyze();
 expect(result.violations.filter(v=>v.impact==='critical')).toEqual([]);
});
