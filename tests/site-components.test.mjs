import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { graphErrors } from '../scripts/lib/spec-invariants.mjs';
const read = p=>JSON.parse(readFileSync(p,'utf8'));
const inventory=read('src/ui-catalog/site-compositions-audit.json');
const lock=read('src/ui-catalog/contracts.lock.json');
const known=new Set(lock.components.filter(c=>c.tier==='base'||['DataTable','DatePicker','Field','BlockSidebar'].includes(c.name)||/^(Dashboard01|Login0[1-5]|Signup0[1-5]|Sidebar(?:0[1-9]|1[0-6]))$/.test(c.name)).map(x=>x.name));
const included=inventory.files.filter(x=>x.decision==='admitted');
const excluded=inventory.files.filter(x=>x.decision==='excluded');
const manifest=read('src/ui-catalog/extensions/composites/generated-manifest.json').components;
const generatedNames=new Set(manifest.map(x=>x.name));
const generatedCode=readFileSync('src/ui-catalog/extensions/generated/composite-implementations.tsx','utf8');

test('inventário cobre 75 arquivos com decisões documentadas',()=>{
 assert.equal(inventory.files.length,75);
 assert.equal(included.length,15);
 assert.equal(excluded.length,60);
 assert.equal(new Set(inventory.files.map(x=>x.path)).size,75);
 for(const row of inventory.files){
  assert.ok(row.sourceReview.includes('TSX'),row.name);
  assert.ok(row.reason?.trim(),row.name);
  assert.ok(row.url.endsWith(row.path),row.name);
 }
});

for(const item of included){
 test(`${item.type}: origem, schema, template e amostra de prévia intactos`,()=>{
  assert.ok(existsSync(item.componentPath));
  assert.ok(existsSync(item.templatePath));
  const code=readFileSync(item.componentPath,'utf8');
  const interactive=['SiteCardsActivityGoal','SiteCardsChat','SiteCardsCookieSettings','SiteCardsPaymentMethod','SiteCardsTeamMembers'];
  if(interactive.includes(item.type)) { assert.ok(code.includes(`export function ${item.type}(`)); assert.ok(code.includes('useState')); }
  else { assert.ok(generatedNames.has(item.type)); assert.ok(generatedCode.includes(`${item.type}: createComposite<`)); }
  const spec=read(item.templatePath);
  assert.equal(spec.elements[spec.root].type,'Card');
  assert.ok(Object.keys(spec.elements).length>=2);
  assert.ok(Object.values(spec.elements).every(n=>known.has(n.type)));
  assert.deepEqual(graphErrors(spec,[...known],{allowedActions:['buttonClick','setState','pushState','removeState','formSubmit','linkClick']}),[]);
  const digest=createHash('sha256').update(readFileSync(item.templatePath)).digest('hex');
  assert.equal(digest,item.compositionHash);
  assert.equal(digest,lock.components.find(c=>c.name===item.type)?.compositionHash);
  const preview=read(`src/ui-explorer-samples/${item.type}.json`);
  assert.equal(preview.elements[preview.root].type,item.type);
  assert.deepEqual(preview.elements[preview.root].children,[]);
  assert.equal(item.visualStatus,'comparison-screenshot-pending');
 });
}

test('card PaymentMethod apresenta plano, número do cartão, validade e CVC',()=>{
 const item=included.find(x=>x.name==='cards/payment-method.tsx');
 const spec=read(item.templatePath);
 const labels=Object.values(spec.elements).map(x=>x.props?.label);
 for(const label of ['Plan','Card number','Expires','Year','CVC'])assert.ok(labels.includes(label),label);
 assert.ok(Object.values(spec.elements).some(x=>x.type==='Radio'));
});
test('card ReportIssue apresenta campos e níveis de severidade originais',()=>{
 const item=included.find(x=>x.name==='cards/report-issue.tsx');
 const spec=read(item.templatePath);
 const labels=Object.values(spec.elements).map(x=>x.props?.label);
 for(const name of ['Area','Security Level','Subject','Description'])assert.ok(labels.includes(name),name);
});
test('a política preserva seis telas existentes e não reintroduz as antigas',()=>{
 for(const id of ['dashboard','usuarios','catalogo','playground','extensoes','auditoria'])assert.ok(!existsSync(`src/ui-screens/${id}.json`));
 assert.equal(lock.components.length,102);
});
test('revisão visual estrita permanece pendente sem evidência de screenshots',()=>{
 const result=spawnSync(process.execPath,['scripts/check-site-compositions.mjs','--strict'],{encoding:'utf8'});
 assert.notEqual(result.status,0);
 assert.match(result.stderr,/comparação visual/);
});
