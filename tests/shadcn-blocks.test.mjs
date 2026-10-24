import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {graphErrors} from "../scripts/lib/spec-invariants.mjs";
const read=p=>JSON.parse(readFileSync(p,"utf8"));
const blocks=read("src/ui-catalog/block-source-inventory.json").blocks;
const allowed=read("src/ui-catalog/contracts.lock.json").components.slice(0,44).map(x=>x.name).concat("BlockSidebar");
for(const b of blocks)test(`${b.name} usa composição própria, fonte e preview oficiais`,()=>{
 const tpl=read(b.templatePath);
 assert.equal(tpl.elements[tpl.root].type,"Card");
 assert.equal(graphErrors(tpl,allowed).length,0);
 assert.ok(Object.values(tpl.elements).every(x=>Array.isArray(x.children)));
 assert.match(b.previewUrl,/ui.shadcn.com\/view\/new-york-v4/);
 assert.ok(Object.keys(tpl.elements).length>=3);
});
test("dashboard contem indicadores, gráfico e tabela",()=>{
 const t=read(blocks.find(b=>b.name==="dashboard-01").templatePath);
 for(const type of ["Metric","LineGraph","Table","BlockSidebar"])assert.ok(Object.values(t.elements).some(x=>x.type===type),type);
});
test("autenticacao distingue layouts e campos",()=>{
 for(const b of blocks.filter(x=>["login","signup"].includes(x.family))){
  const t=read(b.templatePath),n=+b.name.slice(-2);
  assert.ok(Object.values(t.elements).some(x=>x.type==="Input"&&x.props.label==="Email"),b.name);
  assert.equal(Object.values(t.elements).some(x=>x.type==="Input"&&x.props.label==="Password"),n!==5,b.name);
  if([2,4].includes(n))assert.ok(Object.values(t.elements).some(x=>x.type==="Image"),b.name);
 }
});
test("16 sidebars usam shadcn Sidebar declarativa",()=>{
 assert.equal(blocks.filter(x=>x.family==="sidebar").length,16);
 for(const b of blocks.filter(x=>x.family==="sidebar"))assert.ok(Object.values(read(b.templatePath).elements).some(x=>x.type==="BlockSidebar"),b.name);
});

test("diretório Base UI inteiro inventariado: 175 arquivos",()=>{
 const audit=read("src/ui-catalog/block-repository-inventory.json");
 assert.equal(audit.files.length,175);
 assert.equal(new Set(audit.files.map(x=>x.path)).size,175);
 assert.equal(audit.files.filter(x=>x.role==="unrendered-component"||x.role==="unrendered-helper").length,4);
 assert.ok(audit.files.every(x=>x.sourceUrl.endsWith(x.path)));
});
