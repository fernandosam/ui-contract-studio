import {test,expect} from '@playwright/test';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';

// Structural evidence complements screenshots. It is not a pixel-perfect score.
const inv=JSON.parse(readFileSync('src/ui-catalog/block-source-inventory.json','utf8')) as
  {blocks:Array<{id:string;name:string;family:string;previewUrl:string}>};
const routes:Record<string,string>={dashboard:'blocos-dashboard',login:'blocos-login',signup:'blocos-signup'};
for(const block of inv.blocks.filter(b=>['login','signup'].includes(b.family))){
 test(`@structure-fidelity ${block.name} / typography, icons and geometry`,async({page},info)=>{
  const mobile=info.project.name==='mobile';
  await page.setViewportSize(mobile?{width:390,height:844}:{width:1440,height:900});
  const errors:string[]=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`/?screen=${routes[block.family]}`);
  const root=page.locator(`[data-shadcn-block="${block.name}"]`);
  await expect(root).toBeVisible();
  const metrics=await root.evaluate(el=>{
   const box=(node:Element)=>{const b=node.getBoundingClientRect();return {x:b.x,y:b.y,width:b.width,height:b.height,right:b.right};};
   const visible=(node:Element)=>{const s=getComputedStyle(node);const b=node.getBoundingClientRect();return b.width>2&&b.height>2&&s.visibility!=='hidden'&&s.display!=='none';};
   const selector='h1,h2,h3,p,label,input,button,svg,[data-slot="card"],[data-slot="card-title"]';
   return {root:box(el),nodes:[...el.querySelectorAll(selector)].filter(visible).map(node=>{
    const style=getComputedStyle(node);return {tag:node.getAttribute('data-slot')==='card-title'?'card-title':node.tagName.toLowerCase(),text:(node.textContent??'').slice(0,60),
     ...box(node),fontSize:style.fontSize,fontWeight:style.fontWeight,lineHeight:style.lineHeight,
     display:style.display,icon:node.tagName.toLowerCase()==='svg'};
   })};
  });
  expect(errors).toEqual([]);
  expect(metrics.root.width).toBeGreaterThan(100);
  for(const node of metrics.nodes.filter(n=>n.tag==='input'||n.tag==='button')){
   expect(node.x,block.name+' control outside left edge').toBeGreaterThanOrEqual(metrics.root.x-2);
   expect(node.right,block.name+' control outside right edge').toBeLessThanOrEqual(metrics.root.right+2);
  }
  if(block.family!=='dashboard'){
   expect(metrics.nodes.some(n=>n.tag==='h2'||n.tag==='h3'||n.tag==='card-title')).toBeTruthy();
   expect(metrics.nodes.some(n=>n.tag==='input')).toBeTruthy();
  }
  const folder=join('reports/structure-fidelity',info.project.name);
  mkdirSync(folder,{recursive:true});
  writeFileSync(join(folder,`${block.name}.json`),JSON.stringify({block:block.name,reference:block.previewUrl,viewport:mobile?'mobile':'desktop',...metrics},null,2));
 });
}
