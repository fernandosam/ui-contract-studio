import {test,expect} from '@playwright/test';

test('semantic discovery and category filtering preserve approved contract details',async({page})=>{
 await page.goto('/?screen=explorador-primitivos');
 const search=page.getByRole('searchbox',{name:'Buscar componente'});
 await search.fill('confirmação');
 const dialog=page.getByLabel('Componentes registrados').getByRole('button',{name:/AlertDialog/}).first();
 await expect(dialog).toBeVisible();
 await page.getByLabel('Finalidade').selectOption('Confirmação e feedback');
 await expect(dialog).toBeVisible();
 await page.getByLabel('Disponibilidade ao Pi').selectOption('available');
 await expect(dialog).toBeVisible();
 await dialog.click();
 await expect(page.getByText('Quando usar:')).toBeVisible();
 await page.getByRole('tab',{name:'Contrato',exact:true}).click();
 await expect(page.getByTestId('component-contract')).toContainText('Disponível no canal estável');
 const url=new URL(page.url());
 expect(url.searchParams.get('catalogSearch')).toBe('confirmação');
 expect(url.searchParams.get('catalogGroup')).toBe('Confirmação e feedback');
 expect(url.searchParams.get('catalogPi')).toBe('available');
});
test('shareable search state, no-results and reset are usable on all viewports',async({page})=>{
 await page.goto('/?screen=explorador-compostos&catalogSearch=not-a-real-component&catalogPi=available');
 await expect(page.getByText('Nenhum componente corresponde aos filtros.')).toBeVisible();
 await page.getByRole('button',{name:'Limpar filtros'}).click();
 await expect(page.getByRole('searchbox',{name:'Buscar componente'})).toHaveValue('');
 await expect(page.getByLabel('Disponibilidade ao Pi')).toHaveValue('all');
 await expect(page.getByText(/de \d+ componentes/)).toBeVisible();
});
