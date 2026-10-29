import {test,expect} from '@playwright/test';

test('compare reviewed primitives without promoting claims or changing the catalog',async({page})=>{
 await page.goto('/?screen=explorador-primitivos');
 const search=page.getByRole('searchbox',{name:'Buscar componente'});
 await search.fill('AlertDialog');
 await page.getByLabel('Componentes registrados').getByRole('button',{name:'AlertDialog',exact:true}).click();
 await page.getByRole('button',{name:'Comparar semântica'}).click();
 const panel=page.getByTestId('semantic-comparison');
 await expect(panel).toBeVisible();
 await expect(panel.getByText('Selecione um segundo componente para visualizar as diferenças semânticas.')).toBeVisible();
 await panel.getByLabel('Comparar com').selectOption('Dialog');
 await expect(panel.getByRole('article',{name:'Perfil semântico de AlertDialog'})).toContainText('Confirmações críticas');
 await expect(panel.getByRole('article',{name:'Perfil semântico de Dialog'})).toContainText('Editar uma pequena quantidade');
 await expect(panel.getByText('Diferenças de capacidades documentadas')).toBeVisible();
 await expect(panel).toContainText('IDs iguais não garantem comportamento ou API equivalentes');
 await expect(panel).toContainText('não promove capacidades, schemas Zod ou permissões');
 const current=new URL(page.url());
 expect(current.searchParams.get('screen')).toBe('explorador-primitivos');
 expect(current.searchParams.get('catalogComponent')).toBe('AlertDialog');
 expect(current.searchParams.get('catalogCompare')).toBe('Dialog');
 await page.reload();
 await expect(page.getByTestId('semantic-comparison').getByLabel('Comparar com')).toHaveValue('Dialog');
 await page.getByRole('button',{name:'Fechar comparação'}).click();
 await expect(page.getByTestId('semantic-comparison')).toHaveCount(0);
 expect(new URL(page.url()).searchParams.has('catalogCompare')).toBe(false);
 await page.getByRole('tab',{name:'Contrato',exact:true}).click();
 await expect(page.getByTestId('component-contract')).toBeVisible();
});

test('comparison stays inside existing composite contract library',async({page})=>{
 await page.goto('/?screen=explorador-compostos');
 await page.getByLabel('Componentes registrados').getByRole('button',{name:'CharacterCountTextarea',exact:true}).click();
 await page.getByRole('button',{name:'Comparar semântica'}).click();
 const panel=page.getByTestId('semantic-comparison');
 await panel.getByLabel('Comparar com').selectOption('OnboardingChecklist');
 await expect(panel.getByRole('article',{name:'Perfil semântico de CharacterCountTextarea'})).toBeVisible();
 await expect(panel.getByRole('article',{name:'Perfil semântico de OnboardingChecklist'})).toBeVisible();
 await expect(page.getByRole('tab',{name:'Contratos'})).toHaveAttribute('aria-selected','true');
 await expect(page.getByRole('link',{name:'Catálogo Pi'})).toHaveCount(0);
});
