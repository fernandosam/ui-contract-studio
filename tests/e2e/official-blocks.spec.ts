import { auditVisualGeometry } from './visual-geometry';
import { test, expect } from '@playwright/test';
import { mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
const inventory=JSON.parse(readFileSync('src/ui-catalog/block-source-inventory.json','utf8')) as {
  blocks: Array<{name:string;family:string}>
};
const routes:Record<string,string>={dashboard:'blocos-dashboard',login:'blocos-login',signup:'blocos-signup',sidebar:'blocos-sidebar'};
for (const b of inventory.blocks) {
 test(`@block-visual captura local ${b.name}`, async({page},testInfo)=>{
   await page.goto(`/?screen=${routes[b.family]}`);
   await expect(page.getByRole('alert',{name:/interface foi bloqueada/i})).toHaveCount(0);
   const element=page.locator(`[data-shadcn-block="${b.name}"]`);
   await expect(element).toBeVisible({timeout:30000});
   const target=join('reports/blocks/local',testInfo.project.name);
   mkdirSync(target,{recursive:true});
   await element.scrollIntoViewIfNeeded();
   await auditVisualGeometry(element, b.name);
   await element.screenshot({path:join(target,`${b.name}.png`),animations:'disabled'});
 });
}
