/**
 * Read only public ReUI agent-facing Markdown metadata. Never execute remote code.
 * Running this script updates static navigation metadata, not React component implementations.
 * The workflow runs with read permissions here; a later publication step commits reviewed JSON.
 */
import {readFileSync,writeFileSync} from 'node:fs';
const input='src/ui-catalog/reui-guidance.json';
const existing=JSON.parse(readFileSync(input,'utf8'));
const exampleSeeds=JSON.parse(readFileSync('src/ui-catalog/reui-example-seeds.json','utf8'));
const names=['accordion','alert','avatar','badge','button','button-group','card','carousel','checkbox','collapsible','dialog','drawer','dropdown-menu','input','pagination','popover','progress','radio-group','rating','select','separator','skeleton','slider','spinner','switch','table','tabs','textarea','toggle','toggle-group','tooltip'];
const pascal=slug=>slug.split('-').map(x=>x[0].toUpperCase()+x.slice(1)).join('');
const tidy=s=>s.replace(/<[^>]+>/g,'').replace(/\[(.*?)\]\([^)]*\)/g,'$1').replace(/[*_`]/g,'').replace(/&amp;/g,'&').trim().slice(0,350);
function extractSection(md,label){
 const lines=md.split(/\r?\n/);
 const norm=s=>s.trim().replace(/^#{1,6}\s*/,'').replace(/^\*\*(.*?)\*\*$/,'$1').replace(/[:：]$/,'').trim().toLowerCase();
 const index=lines.findIndex(x=>norm(x)===label.toLowerCase());
 if(index<0)return [];
 const result=[];
 for(let i=index+1;i<Math.min(lines.length,index+55);i++){
  const value=lines[i].trim();
  if(/^#{1,6}\s/.test(value)||['when to use','when not to use','agent notes'].includes(norm(value)))break;
  const m=value.match(/^[-*+]\s+(.*)$/)||value.match(/^\d+\.\s+(.*)$/);
  if(m&&tidy(m[1]))result.push(tidy(m[1]));
  if(result.length>=8)break;
 }
 return result;
}
function extractExamples(md,slug){
 const lines=md.split(/\r?\n/);
 const result=[],seen=new Set();
 let inCode=false;
 for(let i=0;i<lines.length;i++){
  const l=lines[i].trim();
  if(/^(```|~~~)/.test(l)){inCode=!inCode;continue}
  if(inCode)continue;
  const codes=[...l.matchAll(/c-[a-z0-9-]+-\d+(?=\.md|\b)/gi)];
  for(const match of codes){
   const id=match[0];
   if(!id.startsWith('c-'+slug+'-')||seen.has(id))continue;
   seen.add(id);
   let title='';
   for(let back=i-1;back>=Math.max(0,i-12);back--){
    const prior=lines[back].trim();
    if(!prior||/^[>#|]/.test(prior)||prior.includes('@reui/')||prior.startsWith('!['))continue;
    if(prior.startsWith('[')&&/code|preview/i.test(prior))continue;
    title=tidy(prior.replace(/^#{1,6}\s*/,''));if(title)break;
   }
   const trailing=l.slice((match.index??0)+id.length).replace(/^\.md\)?\]?\s*[:—-]?\s*/,'').trim();
   if(trailing&&trailing.length<160)title=tidy(trailing);
   result.push([title||id,id]);
  }
 }
 return result;
}
async function fetchMd(slug) {
 const url=`https://reui.io/components/${slug}.md`;
 const controller=new AbortController();
 const timer=setTimeout(()=>controller.abort(),14000);
 try{
  const response=await fetch(url,{signal:controller.signal,headers:{'Accept':'text/markdown,text/plain;q=0.9'}});
  if(!response.ok)throw new Error('HTTP '+response.status);
  const content=await response.text();
  if(content.length>2_000_000||!/when to use/i.test(content))throw new Error('Unexpected Markdown content');
  return content;
 }finally{clearTimeout(timer)}
}
let next={...existing},ok=0,failed=[];
for (const slug of names){
 try{
  const source=await fetchMd(slug);
  const whenUse=extractSection(source,'When to use');
  const whenNotUse=extractSection(source,'When not to use');
  const agentNotes=extractSection(source,'Agent notes');
  const extracted=extractExamples(source,slug);
  const examples=extracted.length?extracted:(existing[pascal(slug)]?.examples?.length?existing[pascal(slug)].examples:exampleSeeds[pascal(slug)]??[]);
  if(slug==='button')console.log('[reui-debug] sample-tail='+source.slice(-1200).replace(/\\n/g,' ').slice(0,500));
  if(!whenUse.length||!whenNotUse.length||!agentNotes.length)throw new Error('Missing structured agent sections');
  const name=pascal(slug);
  next[name]={whenUse,whenNotUse,agentNotes,examples};
  ok++;
  console.log(`[reui] ${name}: ${examples.length} examples, ${whenUse.length}/${whenNotUse.length}/${agentNotes.length} guidance items`);
 }catch(err){failed.push(slug);console.warn(`[reui] ${slug}: ${err instanceof Error?err.message:String(err)}`)}
}
const sorted=Object.fromEntries(Object.entries(next).sort(([a],[b])=>a.localeCompare(b)));
writeFileSync(input,JSON.stringify(sorted,null,2)+'\n');
console.log(`[reui] refreshed=${ok} failed=${failed.length} retained=${Object.keys(next).length}`);
if(ok<2){console.error('ReUI sync incomplete: fewer than two sources available');process.exitCode=1}
