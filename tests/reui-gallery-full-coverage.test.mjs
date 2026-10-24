import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync, existsSync} from "node:fs";

const root="src/ui-catalog/extensions/composites/";
const guides=JSON.parse(readFileSync("src/ui-catalog/reui-guidance.json","utf8"));
const slug=(kind)=>kind.replace(/([a-z0-9])([A-Z])/g,"$1-$2").toLowerCase();

test("Galeria 3: 31 famílias e 559 composições ReUI versionadas individualmente",()=>{
 assert.equal(Object.keys(guides).length,31,"uma orientação por primitiva ReUI");
 const count=Object.values(guides).reduce((sum,guide)=>sum+guide.examples.length,0);
 assert.equal(count,559,"preservar todos os exemplos oficiais");
 for(const [kind,guide] of Object.entries(guides)){
  assert.ok(guide.examples.length>0,`${kind} não tem exemplos`);
  const component=slug(kind);
  const identifiers=new Set();
  for(const [i,record] of guide.examples.entries()){
   assert.equal(record.length,2);
   const [title,id]=record;
   assert.ok(title.length>0,kind);
   assert.equal(id,`c-${component}-${i+1}`);
   assert.ok(!identifiers.has(id),id);
   identifiers.add(id);
   const path=`${root}reui-${component}-${i+1}.tsx`;
   assert.ok(existsSync(path),`${kind}: composição ausente ${path}`);
   const source=readFileSync(path,"utf8");
   if(["Accordion","Button","Separator"].includes(kind)){
    assert.match(source,/export (default )?(function|const|\{)/,`${id}: exportação estática`);
   }else{
    assert.match(source,/export\s+default\b/,`${id}: preview default`);
   }
  }
 }
 const registry=readFileSync(`${root}reui-preview.tsx`,"utf8");
 assert.ok(registry.includes("import.meta.glob"),"registro lazy de composições independentes");
 assert.ok(registry.includes("const slug=kind.replace"),"resolução por nome de primitiva");
});

test("Galeria 3 não exibe aviso obsoleto e usa links canônicos para todas as primitivas",()=>{
 const source=readFileSync("src/ui-runtime/catalog-explorer.tsx","utf8");
 assert.ok(!source.includes("Prévia local ainda não implementada"),"Todas as 559 prévias já possuem composição");
 assert.ok(!source.includes("name.toLowerCase()"),"Links de componentes compostos devem usar slug com hífen");
 assert.ok(source.includes("name.replace(/([a-z0-9])([A-Z])/g,'$1-$2').toLowerCase()"),"Links devem usar o slug canônico ReUI");
});
