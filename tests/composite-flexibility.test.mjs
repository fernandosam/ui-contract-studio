import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {compileComposition} from '../src/ui-catalog/extensions/composites/compile-composition.mjs';
const read=p=>JSON.parse(readFileSync(p,'utf8'));
const manifest=read('src/ui-catalog/extensions/composites/generated-manifest.json').components;
const lock=read('src/ui-catalog/contracts.lock.json').components;
const forbidden=['name','href','src','sourceId','checks','on','action','bindings'];
const generated=readFileSync('src/ui-catalog/extensions/composites/generated-node-props.ts','utf8');
const extensions=readFileSync('src/ui-catalog/extensions/catalog.ts','utf8');
test('manifesto contém exatamente 37 composições e contratos tipados de nodeProps',()=>{
 assert.equal(manifest.length,37);
 for(const x of manifest){
  assert.match(generated,new RegExp(`\\b${x.name}: z.object\\(`));
  assert.match(extensions,new RegExp(`\\b${x.name}: \\{\\s*props: strict\\(\\{ nodeProps: compositeNodePropsSchemas\\.${x.name}\\.optional\\(\\)`));
  assert.equal(lock.find(y=>y.name===x.name)?.version,'1.2.0');
 }
});
for(const item of manifest){
 test(`${item.name}: typed overrides update data, preserve type/actions/children and do not mutate template`,()=>{
  const src=read('src/ui-catalog/extensions/composites/templates/'+item.template);
  const initial=JSON.stringify(src);
  const first=Object.entries(src.elements).flatMap(([id,node])=>Object.entries(node.props??{}).filter(([k,v])=>typeof v==='string'&&!forbidden.includes(k)&&!(id===src.root&&['title','description'].includes(k))).map(([k,v])=>({id,k,v})))[0];
  assert.ok(first,item.name+' should have at least one editable text field');
  const modified=compileComposition(src,{nodeProps:{[first.id]:{[first.k]:'Updated: '+first.v}},title:'Custom heading'});
  assert.equal(modified.elements[first.id].props[first.k], 'Updated: '+first.v);
  assert.equal(modified.elements[src.root].props.title,'Custom heading');
  assert.equal(modified.elements[first.id].type,src.elements[first.id].type);
  assert.deepEqual(modified.elements[first.id].children,src.elements[first.id].children);
  assert.deepEqual(modified.elements[first.id].on,src.elements[first.id].on);
  assert.equal(JSON.stringify(src),initial);
  const blocked=compileComposition(src,{nodeProps:{[first.id]:{name:'FORBIDDEN',href:'https://evil.test',on:{press:{action:'malicious'}},type:'X',children:['x']}}});
  assert.deepEqual(blocked.elements[first.id].on,src.elements[first.id].on);
  assert.equal(blocked.elements[first.id].type,src.elements[first.id].type);
  assert.deepEqual(blocked.elements[first.id].children,src.elements[first.id].children);
  assert.equal(blocked.elements[first.id].props.name,src.elements[first.id].props.name);
  assert.equal(blocked.elements[first.id].props.href,src.elements[first.id].props.href);
 });
}
test('structured datasets can be replaced without mutating template',()=>{
 for(const [name,type,key,value] of [
  ['Dashboard01','LineGraph','data',[{label:'Q1',value:12},{label:'Q2',value:33}]],
  ['Dashboard01','Table','rows',[['A','B','C','D','E','F']]],
  ['Sidebar09','BlockSidebar','sections',[{label:'Work',items:['Inbox','Archive']}]],
  ['SiteCardsReportIssue','Select','options',[{label:'Support',value:'support'}]],
 ]){
  const item=manifest.find(x=>x.name===name);const spec=read('src/ui-catalog/extensions/composites/templates/'+item.template);
  const [id,node]=Object.entries(spec.elements).find(([,n])=>n.type===type);
  const result=compileComposition(spec,{nodeProps:{[id]:{[key]:value}}});
  assert.deepEqual(result.elements[id].props[key],value);
  assert.deepEqual(spec.elements[id].props[key],node.props[key]);
 }
});
test('generated node schemas and registry stay deterministic',()=>{
 for(const args of [['scripts/generate-composite-node-props.mjs','--check'],['scripts/generate-composite-registry.mjs','--check']]){
  const result=spawnSync(process.execPath,args,{encoding:'utf8'});
  assert.equal(result.status,0,result.stderr||result.stdout);
 }
});
test('Pi example covers nodeProps in all 37 static composites',()=>{
 for(const e of manifest){
  const spec=read(`pi-catalog/examples/${e.name}.json`);
  const props=spec.elements[spec.root].props;
  assert.ok(props.nodeProps&&Object.keys(props.nodeProps).length===1,e.name);
 }
});
