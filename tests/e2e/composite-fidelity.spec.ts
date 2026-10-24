import {test,expect} from '@playwright/test';
import {readFileSync,mkdirSync} from 'node:fs';
import {join} from 'node:path';
const entries=JSON.parse(readFileSync('src/ui-catalog/composite-fidelity-audit.json','utf8')).items as Array<{name:string;category:string}>;
const gallery1=new Set(JSON.parse(readFileSync('src/ui-catalog/create-preview-inventory.json','utf8')).previews[0].cards.map((c:{id:string})=>c.id));
const blockInfo=JSON.parse(readFileSync('src/ui-catalog/block-source-inventory.json','utf8')).blocks as Array<{id:string;family:string}>;
const byBlock=new Map(blockInfo.map(x=>[x.id,x.family]));
for(const c of entries){
 test(`@composite-fidelity ${c.name} / screenshot local`,async({page},info)=>{
  const routes:Record<string,string>={dashboard:'blocos-dashboard',login:'blocos-login',signup:'blocos-signup',sidebar:'blocos-sidebar'};
  const route=c.category==='gallery'?(gallery1.has(c.name)?'exemplo-01':'exemplo-02'):c.category==='block'?routes[byBlock.get(c.name)??'sidebar']:'explorador-compostos';
  await page.goto(`/?screen=${route}`);
  if(route==='explorador-compostos'){
   await page.getByLabel('Buscar componente').fill(c.name);
   await page.getByRole('button',{name:c.name,exact:true}).click();
  }
  const selector=page.locator(`[data-composite="${c.name}"]`);
  await expect(selector).toBeVisible({timeout:20000});
  const folder=join('reports/composite-fidelity/local',info.project.name==='desktop'?'':info.project.name);
  mkdirSync(folder,{recursive:true});
  await selector.screenshot({path:join(folder,`${c.name}.png`),animations:'disabled'});
 });
}
