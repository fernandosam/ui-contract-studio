import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
test('explorador visual, filtro e tema',async({page})=>{
 await page.goto('/?screen=explorador-compostos');
 await expect(page.getByRole('heading',{name:'Componentes compostos'})).toBeVisible();
 await page.getByLabel('Buscar componente').fill('DatePicker');
 await expect(page.getByRole('button',{name:'DatePicker'})).toBeVisible();
 await page.goto('/?screen=explorador-exemplos');
 await page.getByRole('button',{name:'Padrões'}).click();
 await page.getByLabel('Exemplo',{exact:true}).selectOption('dashboard-kpis');
 await expect(page.getByText(/ui-patterns\/dashboard-kpis\.json/).first()).toBeVisible();
 await page.getByRole('button',{name:'Ativar tema claro'}).click();
 await expect(page.locator('html')).toHaveClass(/light-theme/);
});
test('8 padrões disponíveis e sem violações críticas de acessibilidade',async({page})=>{
 await page.goto('/?screen=explorador-primitivos');
 await page.goto('/?screen=explorador-exemplos');
 await page.getByRole('button',{name:'Padrões'}).click();
 await expect(page.getByRole('option',{name:'Análise gráfica'})).toHaveCount(1);
 const result=await new AxeBuilder({page}).analyze();
 expect(result.violations.filter(v=>v.impact==='critical')).toEqual([]);
});
