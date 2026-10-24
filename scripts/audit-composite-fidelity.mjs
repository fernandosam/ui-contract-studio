#!/usr/bin/env node
/** Offline traceable audit. Counts source/preview references, never claims screenshots.
 * Strict mode requires two actual screenshots for EACH component and is intentionally
 * a pending release gate until reviewed in the WSL browser environment.
 */
import {readFileSync,existsSync,writeFileSync} from 'node:fs';
const read=p=>JSON.parse(readFileSync(p,'utf8'));
const manifest=read('src/ui-catalog/extensions/composites/generated-manifest.json').components;
const gallery=read('src/ui-catalog/create-reference-audit.json').cards;
const blocks=read('src/ui-catalog/block-source-inventory.json').blocks;
const site=read('src/ui-catalog/site-compositions-audit.json');
const siteFiles=Array.isArray(site)?site:(site.files??site.items??[]);
const get=(x)=>siteFiles.find(y=>y.type===x||y.name===x||y.component===x);
const all=[];
for(const c of manifest){
 const g=gallery.find(x=>x.name===c.name), b=blocks.find(x=>x.id===c.name), s=get(c.name);
 const sourcePath=g?.sourcePath ?? b?.sourceFiles?.[0] ?? s?.path ?? null;
 const sourceUrl=g?.sourceUrl ?? b?.sourceUrl ?? s?.url ?? (sourcePath?'https://github.com/shadcn-ui/ui/blob/main/'+sourcePath:null);
 const previewUrl=b?.previewUrl?? (g?'https://ui.shadcn.com/create':s?'https://ui.shadcn.com/examples/cards':null);
 const spec=read('src/ui-catalog/extensions/composites/templates/'+c.template);
 const actualText=Object.values(spec.elements).flatMap(n=>['title','description','text','label'].map(k=>n.props?.[k])).filter(x=>typeof x==='string').map(x=>x.toLowerCase()).join(' ');
 const expected=g?.visibleSourceLabels??[];
 const missing=expected.filter(t=>!actualText.includes(String(t).toLowerCase()));
 const sourceReview=sourceUrl?'source-reference-documented':'source-reference-missing';
 const notes=[];
 if(missing.length)notes.push('Missing exact source labels: '+missing.slice(0,12).join(' | '));
 if(c.blockSlug?.startsWith('sidebar-'))notes.push('Sidebar block uses bounded embedded adapter, not original full-page layout');
 if(!c.blockSlug&&spec.elements[spec.root]?.type==='Card')notes.push('Outer Card structure is adapter approximation; spacing requires screenshot comparison');
 all.push({name:c.name,category:g?'gallery':b?'block':'site',sourcePath,sourceUrl,previewUrl,sourceReview,visualStatus:'screenshot-pending',template:'src/ui-catalog/extensions/composites/templates/'+c.template,missingLabels:missing,notes});
}
const independent=['SiteCardsActivityGoal','SiteCardsChat','SiteCardsCookieSettings','SiteCardsPaymentMethod','SiteCardsTeamMembers'];
for(const name of independent){
 const s=get(name);const sourcePath=s?.path??`apps/v4/components/cards/${name.replace(/^SiteCards/,'').replace(/[A-Z]/g,(a,i)=>(i?'-':'')+a.toLowerCase())}.tsx`;
 all.push({name,category:'stateful',sourcePath,sourceUrl:'https://github.com/shadcn-ui/ui/blob/main/'+sourcePath,previewUrl:'https://ui.shadcn.com/examples/cards',sourceReview:'source-reference-documented',visualStatus:'screenshot-pending',template:null,missingLabels:[],notes:['Local interactive adaptation; compare original JSX and rendered browser states']});
}
if(all.length!==manifest.length+independent.length)throw Error(`Expected ${manifest.length+independent.length} composites, received ${all.length}`);
const audit={schemaVersion:1,version:read('package.json').version,composites:all.length,categories:Object.fromEntries([...new Set(all.map(x=>x.category))].map(x=>[x,all.filter(y=>y.category===x).length])),sourceScope:'Prior v0.13/v0.14/v0.16 code reviews supplemented by selected current upstream DOM/source checks; NOT fresh screenshot certification for all 118.',visualScope:'Actual browser screenshot comparison is PENDING for all 118. Missing labels are heuristic, not a pixel-diff.',items:all};
const json=JSON.stringify(audit,null,2)+'\n';const dest='src/ui-catalog/composite-fidelity-audit.json';
if(process.argv.includes('--check')){
 if(!existsSync(dest)||readFileSync(dest,'utf8')!==json)throw Error('Audit stale; run npm run composites:fidelity');
}else{writeFileSync(dest,json)}
if(process.argv.includes('--strict')){
 const approvals=existsSync('src/ui-catalog/composite-visual-approvals.json')?read('src/ui-catalog/composite-visual-approvals.json').approvals:[];
 const verified=new Map(approvals.map(x=>[x.name,x]));
 const pending=all.filter(x=>{
  const v=verified.get(x.name);
  return !v?.reviewedBy||!v?.reviewedOn||!v?.notes||v?.status!=='approved'||
   !existsSync(`reports/composite-fidelity/reference/${x.name}.png`)||!existsSync(`reports/composite-fidelity/local/${x.name}.png`);
 });
 if(pending.length){console.error(`✗ ${pending.length} composites need real source/local screenshots, manual comparison and named approval.`);process.exit(1)}
}
console.log(`✓ ${all.length} composites with traceable refs; ${all.filter(x=>x.missingLabels.length).length} contain text-label differences; ${all.length} visual screenshots pending.`);
