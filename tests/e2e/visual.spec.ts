import {test,expect} from '@playwright/test';
/** Snapshots require a reviewed baseline generated in a real browser; do not
 * auto-update in CI. Run: npm run test:e2e:visual:update once to approve them. */
for(const theme of ['light','dark'] as const){
 test(`snapshot visual da Galeria 1 ${theme}`,async({page})=>{
   await page.goto('/?screen=exemplo-01');
   await page.evaluate(next=>{document.documentElement.classList.remove('light-theme','dark-theme');document.documentElement.classList.add(`${next}-theme`);},theme);
   await expect(page).toHaveScreenshot(`galeria-1-${theme}.png`,{fullPage:true,animations:'disabled'});
 });
}
