import {test,expect} from '@playwright/test';
import {readFileSync,mkdirSync} from 'node:fs';
import {join} from 'node:path';
const inv=JSON.parse(readFileSync('src/ui-catalog/create-preview-inventory.json','utf8')) as {
 previews:Array<{screen:string;cards:Array<{id:string;representation:string;inlineRoot?:string}>}>
};
for(const group of inv.previews){
 test(`@reference-visual ${group.screen}: capturar todos os cards`,async({page},info)=>{
  await page.goto(`/?screen=${group.screen}`);
  const spec=JSON.parse(readFileSync(`src/ui-screens/${group.screen}.json`,'utf8')) as {elements:Record<string,{props?:{title?:string}}>};
  const target=join('reports/visual-review/local',info.project.name);
  mkdirSync(target,{recursive:true});
  for(const card of group.cards){
   const title=spec.elements[card.inlineRoot??'']?.props?.title;
   const element=card.representation==='inline-primitives'
    ? page.getByText(title??card.id,{exact:true}).locator('xpath=ancestor::*[@data-slot="card"][1]').first()
    : page.locator(`[data-composite="${card.id}"]`);
   await expect(element).toBeVisible({timeout:30000});
   await element.scrollIntoViewIfNeeded();
   await element.screenshot({path:join(target,`${group.screen}-${card.id}.png`),animations:'disabled'});
  }
 });
}
