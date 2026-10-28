import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(path,'utf8');
const app=read('src/ui-runtime/app.tsx');
const catalog=read('src/ui-runtime/catalog-explorer.tsx');
const admission=read('src/ui-runtime/admission-explorer.tsx');

test('only primitives and composites are independent component catalog routes',()=>{
 assert.match(app,/slug:'explorador-primitivos',title:'Primitivas'/);
 assert.match(app,/slug:'explorador-compostos',title:'Compostos'/);
 assert.doesNotMatch(app,/slug:'catalogo-pi',title:/);
 assert.ok(app.includes("query === 'catalogo-pi' ? 'explorador-compostos'"));
 assert.doesNotMatch(app,/tool.slug==='catalogo-pi'/);
});
test('both component catalogs expose versioned metadata and maturity-based selection',()=>{
 assert.match(catalog,/function ContractDetails/);
 assert.match(catalog,/data-testid="component-contract"/);
 assert.match(catalog,/semanticFingerprint/);
 assert.match(catalog,/published\?\.fingerprint===fingerprint/);
 assert.match(catalog,/catalog-stability/);
 assert.match(catalog,/role="tablist" aria-label="Detalhes do componente"/);
 assert.match(catalog,/Nenhum componente corresponde aos filtros/);
});
test('experimental compositions stay under composites and retain local-only preview limits',()=>{
 assert.match(catalog,/<AdmissionExplorer compositionOnly\/>/);
 assert.match(admission,/entry.tier==="composition"/);
 assert.match(admission,/channel==="experimental"/);
 assert.match(admission,/canPreview/);
 assert.match(admission,/SpecScreen/);
});
