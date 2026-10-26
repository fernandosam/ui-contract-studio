import { test, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';

test('ReUI apresenta os 61 exemplos oficiais de Button com paginação',async({page},testInfo)=>{
 await page.goto('/?screen=reui');
 await page.getByLabel('Filtrar componente').selectOption('Button');
 for(let total=12;total<61;total+=12){
  await expect(page.locator('[data-testid^="reui-preview-c-button-"]')).toHaveCount(total);
  await page.getByRole('button',{name:/Carregar mais 12 exemplos/}).click();
 }
 await expect(page.locator('[data-testid^="reui-preview-c-button-"]')).toHaveCount(61);
 for(let i=1;i<=61;i++){
  const preview=page.getByTestId(`reui-preview-c-button-${i}`);
  await expect(preview).toBeVisible();
  await expect(preview.locator('[data-reui-button-example]')).toHaveCount(1);
  await expect(preview.getByText('Prévia local ainda não implementada')).toHaveCount(0);
  const output=`reports/reui-button-visual/${testInfo.project.name}`;
  mkdirSync(output,{recursive:true});
  await preview.screenshot({path:`${output}/c-button-${i}.png`,animations:'disabled'});
 }
});
test('Button fornece estados primitivos e orientações em português',async({page})=>{
 await page.goto('/?screen=explorador-primitivos');
 await page.locator('[aria-label="Componentes registrados"]').getByRole('button',{name:'Button',exact:true}).click();
 const guide=page.getByTestId('primitive-guidance');
 await expect(guide.getByText('Quando usar')).toBeVisible();
 await expect(guide.getByText('Quando não usar')).toBeVisible();
 await expect(guide.getByText('Notas do agente')).toBeVisible();
 await expect(guide.getByText(/Ações de páginas, formulários e diálogos/)).toBeVisible();
});
