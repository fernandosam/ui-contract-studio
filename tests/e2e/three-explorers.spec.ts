import {test,expect} from '@playwright/test';

test('três exploradores independentes no menu Ferramentas',async({page,isMobile})=>{
 await page.goto('/?screen=explorador-primitivos');
 if(isMobile) await page.getByRole('button',{name:'Alternar navegação'}).click();
 for(const [label,slug] of [['Primitivos shadcn','explorador-primitivos'],['Componentes compostos','explorador-compostos'],['Exemplos','explorador-exemplos']]){
  const link=page.locator(`a[href="?screen=${slug}"]`);
  await expect(link).toBeVisible();
  await expect(link).toContainText(label);
 }
 if(isMobile) await page.keyboard.press('Escape');
 await expect(page.getByRole('heading',{name:'Primitivos shadcn'}).first()).toBeVisible();
 await page.goto('/?screen=explorador-compostos');
 await expect(page.getByRole('heading',{name:'Componentes compostos'}).first()).toBeVisible();
 await page.getByLabel('Buscar componente').fill('Dashboard01');
 await page.getByRole('button',{name:'Dashboard01'}).click();
 await expect(page.getByTestId('catalog-live-preview')).toBeVisible();
 await page.goto('/?screen=explorador-exemplos');
 await expect(page.getByRole('heading',{name:'Exemplos e padrões'})).toBeVisible();
 await page.getByLabel('Exemplo',{exact:true}).selectOption('blocos-login');
 await expect(page.getByText(/44 nós|[0-9]+ nós/)).toBeVisible();
});

test('Explorador de exemplos permite selecionar nó e editar propriedades temporariamente',async({page})=>{
 await page.goto('/?screen=explorador-exemplos');
 await page.getByLabel('Exemplo',{exact:true}).selectOption('blocos-login');
 await page.getByLabel('Filtrar nós').fill('Text');
 const node=page.getByRole('group',{name:'Elementos do exemplo'}).getByRole('button').first();
 await node.click();
 await expect(page.getByTestId('catalog-live-preview')).toBeVisible();
 await expect(page.getByText('Propriedades editáveis')).toBeVisible();
 await page.getByRole('button',{name:'Restaurar valores'}).click();
});
