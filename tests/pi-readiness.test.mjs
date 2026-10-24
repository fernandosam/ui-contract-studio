import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {graphErrors} from '../scripts/lib/spec-invariants.mjs';
const read=p=>JSON.parse(readFileSync(p,'utf8'));
const manifest=read('pi-catalog/contracts.json');
const lock=read('src/ui-catalog/contracts.lock.json');
const content=read('src/ui-catalog/composite-content-fields.json').components;
const known=lock.components.map(c=>c.name);
const generatedComposites=new Set(JSON.parse(readFileSync('src/ui-catalog/extensions/composites/generated-manifest.json','utf8')).components.map(x=>x.name));

test('Pi possui 102 exemplos válidos estruturalmente e contratos sem duplicidade',()=>{
 assert.equal(manifest.catalogSize,102);
 assert.equal(manifest.contracts.length,102);
 assert.equal(new Set(manifest.contracts.map(c=>c.type)).size,102);
 for(const c of manifest.contracts){
   assert.ok(existsSync(c.example),c.type);
   const spec=read(c.example);
   assert.equal(spec.elements[spec.root].type,c.type,c.type);
   assert.deepEqual(graphErrors(spec,known,{allowedActions:manifest.actions}),[],c.type);
   assert.equal(c.version,lock.components.find(x=>x.name===c.type)?.version);
 }
});

test('42 compostos expõem content com estrita lista de  chaves editáveis',()=>{
 assert.equal(Object.keys(content).length,42);
 const fields=Object.values(content).flatMap(c=>c.fields);
 assert.ok(fields.length>300);
 for(const [name,config] of Object.entries(content)){
   const info=manifest.contracts.find(x=>x.type===name);
   assert.equal(info?.contentProperty,'content');
   assert.deepEqual(info?.configuredContentFields.map(field=>Object.fromEntries(Object.entries(field).filter(([key])=>key!=='semanticName'))),config.fields);
   const aliases=info?.configuredContentFields.map(f=>f.semanticName);
   assert.equal(aliases.length,config.fields.length);
   assert.equal(new Set(aliases).size,aliases.length);
   assert.ok(aliases.every(a=>typeof a==='string'&&a.length>0));
   const example=read(`pi-catalog/examples/${name}.json`);
   const override=example.elements[example.root].props.content;
   assert.equal(Object.keys(override).length,1);
   const [key]=Object.keys(override);
   assert.ok(config.fields.some(f=>f.path===key),name);
   const source=read(`src/ui-catalog/extensions/composites/templates/${config.template}.json`);
   for(const field of config.fields){
     const [nodeId,prop]=field.path.split('.');
     assert.equal(source.elements[nodeId]?.props?.[prop],field.default,`${name}/${field.path}`);
   }
   assert.equal(lock.components.find(c=>c.name===name).version,(generatedComposites.has(name)||['SiteCardsPaymentMethod','SiteCardsTeamMembers','SiteCardsActivityGoal','SiteCardsCookieSettings'].includes(name))?'1.2.0':'1.1.0');
 }
});

test('três demos anteriormente inertes agora têm estado e eventos autorizados',()=>{
 const pairs={SiteCardsActivityGoal:['change','save'],SiteCardsChat:['send'],SiteCardsCookieSettings:['change','save']};
 const catalog=readFileSync('src/ui-catalog/extensions/catalog.ts','utf8');
 for(const [name,events] of Object.entries(pairs)){
  const start=catalog.indexOf(`  ${name}: {`),end=catalog.indexOf('\n  },',start);
  const part=catalog.slice(start,end);
  for(const event of events) assert.ok(part.includes(`"${event}"`),`${name}.${event}`);
  assert.equal(manifest.contracts.find(c=>c.type===name)?.capability,'local-interactive');
 }
 const goal=readFileSync('src/ui-catalog/extensions/components/site-cards-activity-goal.tsx','utf8');
 assert.match(goal,/setGoal\(/);assert.match(goal,/disabled=\{goal<=min\}/);
 const chat=readFileSync('src/ui-catalog/extensions/components/site-cards-chat.tsx','utf8');
 assert.match(chat,/onSubmit=\{submit\}/);assert.match(chat,/setMessages\(/);
 const cookies=readFileSync('src/ui-catalog/extensions/components/site-cards-cookie-settings.tsx','utf8');
 assert.match(cookies,/setAnalytics/);assert.match(cookies,/disabled=\{!onChange\}/);
});

test('manifesto e fixtures são construções determinísticas, sem internet',()=>{
 for(const script of ['scripts/build-pi-api.mjs','scripts/build-pi-fixtures.mjs']){
  const result=spawnSync(process.execPath,[script,'--check'],{encoding:'utf8'});
  assert.equal(result.status,0,result.stderr);
 }
});
