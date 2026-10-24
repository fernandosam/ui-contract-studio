#!/usr/bin/env node
import {readFileSync,readdirSync,existsSync,mkdirSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
const read=p=>JSON.parse(readFileSync(p,'utf8'));
const target='pi-catalog/examples';
const catalog=read('src/ui-catalog/contracts.lock.json').components;
const contents=read('src/ui-catalog/composite-content-fields.json').components;
const composites=read('src/ui-catalog/extensions/composites/generated-manifest.json').components;
const templates=new Map(composites.map(x=>[x.name,read('src/ui-catalog/extensions/composites/templates/'+x.template)]));
// As fixtures Pi aprovadas preservam exemplos de contratos ativos quando telas legadas saem de circulação.
const sources=['src/ui-explorer-samples','pi-catalog/examples','src/ui-screens','src/ui-catalog/extensions/composites/templates','src/ui-patterns'];
const candidates=new Map();
for(const folder of sources)for(const filename of readdirSync(folder).filter(n=>n.endsWith('.json')&&!n.endsWith('.meta.json')).sort()){
 const spec=read(join(folder,filename));
 if(!spec.elements || !spec.root)continue;
 for(const [id,node] of Object.entries(spec.elements)){
  if(node.type && !candidates.has(node.type))candidates.set(node.type,{spec,id,source:`${folder}/${filename}`});
 }
}
function branch(spec,root){
 const nodes={};
 function include(id){
  if(nodes[id]||!spec.elements[id])return;
  const v=spec.elements[id];nodes[id]=structuredClone(v);
  for(const child of v.children??[])include(child);
  for(const children of Object.values(v.slots??{}))for(const child of children)include(child);
 }
 include(root);
 const result={root,elements:nodes};if(spec.state)result.state=spec.state;
 return result;
}
const errors=[];
const missing=catalog.filter(item=>!candidates.has(item.name)).map(item=>item.name);
if(missing.length)errors.push(`Amostras ausentes para ${missing.length}/${catalog.length} contratos: ${missing.join(', ')}`);
if(process.argv.includes('--write'))mkdirSync(target,{recursive:true});
for(const item of catalog){
 const candidate=candidates.get(item.name);if(!candidate){errors.push(`${item.name}: nenhum exemplo localizado`);continue;}
 const spec=branch(candidate.spec,candidate.id);
 // All configurable composite examples demonstrate the actual approved content API.
 const fields=contents[item.name]?.fields;
 if(fields?.length){
   const selected=fields.find(x=>!x.path.startsWith(candidate.id+'.'))??fields[0];
   spec.elements[spec.root].props.content = {[selected.path]:selected.default};
 }
 // Provide an independently valid nodeProps example for EVERY declarative composite.
 const template=templates.get(item.name);
 if(template){
   const selected=Object.entries(template.elements).flatMap(([id,node])=>Object.entries(node.props??{}).filter(([key,v])=>!['name','href','src','sourceId','checks','title','description'].includes(key)&&['string','number','boolean'].includes(typeof v)).map(([key,value])=>({id,key,value}))).find(x=>x.key==='label'||x.key==='text'||x.key==='value')
     ?? Object.entries(template.elements).flatMap(([id,node])=>Object.entries(node.props??{}).filter(([key,v])=>!['name','href','src','sourceId','checks','title','description'].includes(key)&&['string','number','boolean'].includes(typeof v)).map(([key,value])=>({id,key,value})))[0];
   if(selected)spec.elements[spec.root].props.nodeProps={[selected.id]:{[selected.key]:selected.value}};
 }
 // Demonstrate semantic APIs, while retaining the backwards-compatible content property.
 if(item.name==='SiteCardsActivityGoal')Object.assign(spec.elements[spec.root].props,{goal:350,minimum:200,maximum:400,step:10,showBarChart:true});
 if(item.name==='SiteCardsCookieSettings')Object.assign(spec.elements[spec.root].props,{showOptionalCookies:false});
 if(item.name==='SiteCardsPaymentMethod')Object.assign(spec.elements[spec.root].props,{
   plans:[{id:'starter',label:'Starter Plan',displayPrice:'$10',description:'Basic features'},{id:'pro',label:'Pro Plan',displayPrice:'$20',description:'Advanced features'}],
   defaultPlan:'starter',checkoutLabel:'Select plan'
 });
 if(item.name==='SiteCardsTeamMembers')Object.assign(spec.elements[spec.root].props,{
   members:[{id:'sofia',name:'Sofia Davis',role:'Owner'},{id:'jackson',name:'Jackson Lee',role:'Developer'}],
   roles:['Viewer','Developer','Billing','Owner'],allowRoleChanges:true
 });
 const file=join(target,item.name+'.json');const payload=JSON.stringify(spec,null,2)+'\n';
 if(process.argv.includes('--write'))writeFileSync(file,payload);
 else if(!existsSync(file)||readFileSync(file,'utf8')!==payload)errors.push(`${item.name}: amostra ausente/desatualizada`);
}
if(errors.length){errors.forEach(x=>console.error('✗ '+x));process.exit(1);}
console.log(`✓ ${catalog.length} exemplos JSON independentes para os contratos do Pi`);
