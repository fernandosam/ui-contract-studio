import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {readFileSync, existsSync} from 'node:fs';
const api=JSON.parse(readFileSync('pi-catalog/contracts.json','utf8'));
test('context pack contém somente tipos solicitados e exemplos íntegros',()=>{
 const run=spawnSync(process.execPath,['scripts/select-pi-context.mjs','--types=Button,Dashboard01,SiteCardsActivityGoal','--stdout','--metadata-only'],{encoding:'utf8'});
 assert.equal(run.status,0,run.stderr);
 const pack=JSON.parse(run.stdout);
 assert.deepEqual(pack.selected.map(x=>x.contract.type),['Button','Dashboard01','SiteCardsActivityGoal']);
 assert.ok(pack.selected.every(x=>x.example.elements[x.example.root].type===x.contract.type));
 assert.equal(pack.selected[1].contract.contentProperty,'content');
 assert.ok(pack.selected[1].contract.configuredContentFields.length>0);
 assert.equal(api.catalogSize,102);
});
test('tipo não aprovado e lotes grandes são bloqueados',()=>{
 const invalid=spawnSync(process.execPath,['scripts/select-pi-context.mjs','--types=ArbitraryWidget','--stdout','--metadata-only'],{encoding:'utf8'});
 assert.notEqual(invalid.status,0);
 assert.match(invalid.stderr,/não aprovado/);
 const tooMany=spawnSync(process.execPath,['scripts/select-pi-context.mjs','--types='+api.contracts.slice(0,26).map(x=>x.type).join(',')],{encoding:'utf8'});
 assert.notEqual(tooMany.status,0);
});

test('contexto para geração exige schemas reais; consulta por metadados é explícita',()=>{
 const run=spawnSync(process.execPath,['scripts/select-pi-context.mjs','--types=Card','--stdout'],{encoding:'utf8'});
 if (existsSync('pi-catalog/props-json-schema.json')) {
  assert.equal(run.status,0,run.stderr);
  assert.ok(JSON.parse(run.stdout).selected[0].propsSchema, 'JSON Schema exportado deve estar disponível');
 } else {
  assert.notEqual(run.status,0);
  assert.match(run.stderr,/pi:zod-schema/);
 }
 const metadata=spawnSync(process.execPath,['scripts/select-pi-context.mjs','--types=Card','--metadata-only','--stdout'],{encoding:'utf8'});
 assert.equal(metadata.status,0,metadata.stderr);
 assert.equal(JSON.parse(metadata.stdout).metadataOnly,true);
});
