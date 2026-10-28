import {test,expect} from '@playwright/test';

test('catalog navigation is consolidated while legacy admission deep links still work',async({page})=>{
 await page.goto('/?screen=explorador-primitivos');
 await expect(page.getByRole('heading',{name:'Primitivas',exact:true}).first()).toBeVisible();
 await expect(page.getByRole('link',{name:'Catálogo Pi'})).toHaveCount(0);
 await page.getByRole('tab',{name:'Contrato',exact:true}).click();
 await expect(page.getByTestId('component-contract')).toBeVisible();
 await expect(page.getByTestId('component-contract')).toContainText('Fingerprint SHA-256');
 await page.goto('/?screen=explorador-compostos');
 await expect(page.getByRole('heading',{name:'Compostos',exact:true}).first()).toBeVisible();
 await page.getByRole('tab',{name:'Candidatos experimentais'}).click();
 await expect(page.getByTestId('admission-catalog')).toBeVisible();
 await page.goto('/?screen=catalogo-pi');
 await expect(page.getByTestId('admission-catalog')).toBeVisible();
});
test('primitive search and stability filters provide recoverable empty states',async({page})=>{
 await page.goto('/?screen=explorador-primitivos');
 const search=page.getByRole('searchbox',{name:'Buscar componente'});
 await search.fill('no-such-component-ever');
 await expect(page.getByText('Nenhum componente corresponde aos filtros.')).toBeVisible();
 await search.fill('Button');
 await expect(page.getByRole('button',{name:'Button',exact:true}).first()).toBeVisible();
 await page.getByLabel('Estabilidade').selectOption('experimental');
 await expect(page.getByText('Nenhum componente corresponde aos filtros.')).toBeVisible();
 await page.getByLabel('Estabilidade').selectOption('stable');
 await expect(page.getByRole('button',{name:'Button',exact:true}).first()).toBeVisible();
});
