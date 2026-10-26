import {test,expect} from '@playwright/test';
test('ReUI filtra componentes e limita renderizacao inicial',async({page})=>{
 await page.goto('/?screen=reui');
 await expect(page.getByRole('heading',{name:'ReUI'})).toBeVisible();
 await expect(page.locator('[data-testid^="reui-preview-"]')).toHaveCount(11);
 await page.getByLabel('Filtrar componente').selectOption('Button');
 await expect(page.getByRole('heading',{name:'Button',exact:true})).toBeVisible();
 await expect(page.locator('[data-testid="reui-preview-c-button-1"]')).toBeVisible();
 await page.getByRole('button',{name:'Carregar mais 12 exemplos'}).click();
 await expect(page.locator('[data-testid^="reui-preview-"]')).toHaveCount(24);
 await page.getByLabel('Pesquisar exemplos').fill('loading state');
 await expect(page.locator('[data-testid^="reui-preview-"]')).toHaveCount(1);
 await page.getByLabel('Filtrar componente').selectOption('Accordion');
 await page.getByLabel('Pesquisar exemplos').fill('');
 await expect(page.locator('[data-testid="reui-preview-c-accordion-1"]')).toBeVisible();
});
test('Explorador primitivo mostra guias verificadas sem inventar outros',async({page})=>{
 await page.goto('/?screen=explorador-primitivos');
 await page.locator('[aria-label="Componentes registrados"]').getByRole('button',{name:'Button',exact:true}).click();
 await expect(page.getByTestId('primitive-guidance').getByText('Quando usar')).toBeVisible();
 await expect(page.getByTestId('primitive-guidance').getByText('Notas do agente')).toBeVisible();
 await expect(page.getByTestId('primitive-guidance').getByRole('link',{name:/Documentação ReUI/})).toHaveAttribute('href','https://reui.io/components/button');
});
