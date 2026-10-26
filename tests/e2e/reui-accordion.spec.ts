import {test,expect} from '@playwright/test';
for(let i=1;i<=11;i++){
 test(`ReUI Accordion ${i} has interactive preview`,async({page})=>{
  await page.goto('/?screen=reui');
  await page.getByLabel('Filtrar componente').selectOption('Accordion');
  const block=page.locator(`[data-testid="reui-preview-c-accordion-${i}"]`);
  await expect(block).toBeVisible();
  await expect(block.getByText('Prévia local ainda não implementada')).toHaveCount(0);
  const triggers=block.locator('[data-slot="accordion-trigger"]');
  await expect(triggers.first()).toBeVisible();
  expect(await triggers.count()).toBeGreaterThanOrEqual(2);
  const first=triggers.first();
  const initial=await first.getAttribute('aria-expanded');
  await first.click();
  await expect(first).toHaveAttribute('aria-expanded',initial==='true'?'false':'true');
  await first.click();
  await expect(first).toHaveAttribute('aria-expanded',initial==='true'?'true':'false');
 });
}
test('Accordion 5 disables unavailable item',async({page})=>{
 await page.goto('/?screen=reui');
 await page.getByLabel('Filtrar componente').selectOption('Accordion');
 const block=page.getByTestId('reui-preview-c-accordion-5');
 const disabled=block.locator('[data-slot="accordion-trigger"]').nth(1);
 await expect(disabled).toBeDisabled();
});
test('Accordion guidance is Portuguese and describes usage and restrictions',async({page})=>{
 await page.goto('/?screen=explorador-primitivos');
 await page.locator('[aria-label="Componentes registrados"]').getByRole('button',{name:'Accordion',exact:true}).click();
 const info=page.getByTestId('primitive-guidance');
 await expect(info.getByRole('heading',{name:'Quando usar',exact:true})).toBeVisible();
 await expect(info.getByRole('heading',{name:'Quando não usar',exact:true})).toBeVisible();
 await expect(info.getByRole('heading',{name:'Notas do agente',exact:true})).toBeVisible();
 await expect(info.getByText(/Perguntas frequentes em que cada questão/)).toBeVisible();
});
