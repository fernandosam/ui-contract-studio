import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const previews=[
  {slug:'exemplo-01',count:31,title:'Galeria 1'},
  {slug:'exemplo-02',count:33,title:'Galeria 2'},
] as const;

for(const p of previews){
  test(`${p.slug}: todos os ${p.count} cards e menu visíveis`,async ({page})=>{
    await page.goto(`/?screen=${p.slug}`);
    await expect(page.getByRole('heading',{name:p.title,exact:true})).toBeVisible();
    await expect(page.getByText('Exemplos',{exact:true}).first()).toBeVisible();
    expect(await page.locator('[data-slot="card"]').count()).toBeGreaterThanOrEqual(p.count);
    await expect(page.getByText('A interface foi bloqueada')).toHaveCount(0);
    const report=await new AxeBuilder({page}).analyze();
    expect(report.violations.filter(v=>v.impact==='critical'||v.impact==='serious')).toEqual([]);
  });
}

test('exemplo 2: grupo de notificações admite alternância local',async ({page})=>{
  await page.goto('/?screen=exemplo-02');
  await expect(page.locator('[data-slot="card-title"]').getByText('Notifications',{exact:true}).first()).toBeAttached();
  const checkbox=page.getByRole('checkbox',{name:'Goal milestones'});
  await expect(checkbox).toBeVisible();
  await checkbox.click();
  await expect(checkbox).toBeChecked();
});

test('ShippingAddress e Invoice são composições reutilizáveis com conteúdo próprio', async ({page}) => {
  await page.goto('/?screen=exemplo-01');
  await expect(page.getByText('Shipping Address', {exact:true})).toBeAttached();
  await expect(page.getByLabel('ZIP Code', {exact:true})).toBeAttached();
  await expect(page.getByLabel('Country', {exact:true})).toBeAttached();
  await expect(page.getByText('Total Due', {exact:true})).toBeAttached();
  await expect(page.getByText('Invoice #INV-2847')).toBeAttached();
});
