import { test, expect, type Page } from '@playwright/test';
import { readFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const inventory = JSON.parse(readFileSync('src/ui-catalog/create-preview-inventory.json','utf8')) as {
  previews: Array<{name:string;screen:string;cards:Array<{id:string;inlineRoot?:string;representation:string}>}>;
};
const screenSpecs = Object.fromEntries(inventory.previews.map(g=>[g.screen,
  JSON.parse(readFileSync(`src/ui-screens/${g.screen}.json`,'utf8')) as {elements:Record<string,{props?:{title?:string}}>}
]));
function cardLocator(page:Page, screen:string, card:{id:string;inlineRoot?:string;representation:string}) {
  if(card.representation!=='inline-primitives') return page.locator(`[data-composite="${card.id}"]`);
  const title=screenSpecs[screen].elements[card.inlineRoot!]?.props?.title;
  if(!title) throw Error(`Título inline não encontrado: ${card.id}`);
  return page.getByText(title,{exact:true}).locator('xpath=ancestor::*[@data-slot="card"][1]').first();
}
for (const group of inventory.previews) {
  test(`@gallery-sandbox ${group.screen} captura ${group.cards.length} componentes`,async({page},info)=>{
    const viewport = info.project.name==='mobile' ? {width:390,height:844} : {width:1440,height:900};
    await page.setViewportSize(viewport);
    await page.goto(`/?screen=${group.screen}`);
    await expect(page.getByRole('alert',{name:/interface foi bloqueada/i})).toHaveCount(0);
    await expect(page.locator('main[role="alert"]')).toHaveCount(0);
    await expect(page.locator('[data-composite]')).toHaveCount(group.cards.filter(x=>x.representation!=='inline-primitives').length,{timeout:30000});
    const target=join('reports/gallery-fidelity/local',info.project.name);
    mkdirSync(target,{recursive:true});
    for(const c of group.cards){
      const element=cardLocator(page,group.screen,c);
      await expect(element,`${c.id}: componente renderizado`).toBeVisible({timeout:30000});
      await expect(element).not.toContainText('Componente indisponível');
      await element.scrollIntoViewIfNeeded();
      const bounding=await element.boundingBox();
      expect(bounding,`${c.id}: deve ter geometria`).not.toBeNull();
      expect(bounding!.width).toBeGreaterThan(80);
      expect(bounding!.x).toBeGreaterThanOrEqual(-1);
      expect(bounding!.x+bounding!.width).toBeLessThanOrEqual(viewport.width+2);
      await element.screenshot({path:join(target,`${c.id}.png`),animations:'disabled',timeout:30000});
    }
    const overflow=await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow,`Overflow horizontal em ${group.screen}`).toBeLessThanOrEqual(2);
  });
}
test('@gallery-sandbox notificações: seleção conjunta e estado intermediário',async({page})=>{
  await page.goto('/?screen=exemplo-02');
  const card=page.locator('[data-composite="NotificationSettings"]');
  const all=card.getByRole('checkbox',{name:'Select all'});
  const goal=card.getByRole('checkbox',{name:'Goal milestones'});
  const transactions=card.getByRole('checkbox',{name:'Transaction alerts'});
  await expect(all).toBeVisible();
  await expect(transactions).toBeChecked();
  await expect(goal).not.toBeChecked();
  await all.click();
  await expect(goal).toBeChecked();
  await expect(all).toBeChecked();
  await transactions.click();
  await expect(transactions).not.toBeChecked();
  await expect(all).not.toBeChecked();
  await card.getByRole('button',{name:'Save Preferences'}).click();
  await expect(card.getByRole('status')).toContainText('saved locally');
});
test('@gallery-sandbox endereço e fatura reproduzem dados oficiais',async({page})=>{
  await page.goto('/?screen=exemplo-01');
  const shipping=page.locator('[data-composite="ShippingAddress"]');
  for(const name of ['Street address','Apt / Suite','City','State','ZIP Code','Country'])
    await expect(shipping.getByText(name,{exact:true}).first()).toBeVisible();
  await expect(shipping.getByRole('button',{name:'Save Address'})).toBeVisible();
  const invoice=page.locator('[data-composite="Invoice"]');
  await expect(invoice.getByText('$2,437.00').first()).toBeVisible();
  await expect(invoice.getByText('Pending',{exact:true})).toBeVisible();
});
