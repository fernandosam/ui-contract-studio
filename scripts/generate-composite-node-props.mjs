#!/usr/bin/env node
/** Generate strictly bounded per-node override Zod types from reviewed static templates.
 * No eval/remote content and no changes to action, element type or children.
 */
import {readFileSync,writeFileSync} from 'node:fs';
const read=p=>JSON.parse(readFileSync(p,'utf8'));
const manifest=read('src/ui-catalog/extensions/composites/generated-manifest.json');
const out='src/ui-catalog/extensions/composites/generated-node-props.ts';
const json=x=>JSON.stringify(x);
const EXCLUDED=new Set(['name','href','src','sourceId','checks','on','bindings','action','handler','id']);
function safeField(key,value,depth=0){
 if(depth>5)return null;
 if(EXCLUDED.has(key)||key.startsWith('$')||key.startsWith('on'))return null;
 if(typeof value==='string')return `z.string().max(${['text','description','content'].includes(key)?2000:480})`;
 if(typeof value==='number')return 'z.number().finite()';
 if(typeof value==='boolean')return 'z.boolean()';
 if(value===null){
  if(['value','defaultValue','checked','open','change','prefix','suffix','caption','title','description','placeholder'].includes(key))return 'z.union([z.string().max(2000),z.number().finite(),z.boolean(),z.null()])';
  return null;
 }
 if(Array.isArray(value)){
  const sample=value.find(x=>x!=null);
  if(sample===undefined)return null;
  const item=safeField('_element',sample,depth+1);
  return item?`z.array(${item}).max(${key==='rows'?2000:key==='data'?100:key==='sections'?8:100})`:null;
 }
 if(value&&typeof value==='object'){
  const props=Object.entries(value).map(([k,v])=>{const node=safeField(k,v,depth+1);return node?`${json(k)}: ${node}.optional()`:null}).filter(Boolean);
  return props.length?`z.object({${props.join(',')}}).strict()`:null;
 }
 return null;
}
const entries=[];let fieldCount=0, complexCount=0;
for(const {name,template} of manifest.components){
 const spec=read('src/ui-catalog/extensions/composites/templates/'+template);
 const nodes=[];
 for(const [id,node] of Object.entries(spec.elements)){
  const fields=[];
  for(const [key,v] of Object.entries(node.props??{})){
   if(id===spec.root&&['title','description'].includes(key))continue;
   const s=safeField(key,v);
   if(s){fields.push(`${json(key)}: ${s}.optional()`);fieldCount++;if(Array.isArray(v)||v&&typeof v==='object')complexCount++;}
  }
  if(fields.length)nodes.push(`${json(id)}: z.object({${fields.join(',')}}).strict().optional()`);
 }
 entries.push(`  ${name}: z.object({${nodes.join(',')}}).strict(),`);
}
const content=`/* AUTO-GENERATED: run npm run composites:node-props:generate. No hand edits. */\nimport {z} from 'zod';\nexport const compositeNodePropsSchemas = {\n${entries.join('\n')}\n};\n`;
if(process.argv.includes('--check')){
 if(readFileSync(out,'utf8')!==content){console.error('✗ Node props generated stale.');process.exit(1)}
}else writeFileSync(out,content);
console.log(`✓ ${entries.length} per-component node schemas, ${fieldCount} editable properties, ${complexCount} complex properties`);
