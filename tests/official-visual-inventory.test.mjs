import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {validateOfficialVisualInventory} from "../scripts/lib/official-visual-inventory.mjs";

const read=path=>JSON.parse(readFileSync(path,"utf8"));
const plan=read("shadcn-plan.json");
const manifest=read("scripts/official-component-examples.json");
const pi=read("pi-catalog/contracts.json");
const priorities=["aspect-ratio","kbd","empty","scroll-area","alert-dialog","attachment","bubble","context-menu","hover-card","item","marker","message"];
const check=update=>{
 const copy=structuredClone(manifest);
 update(copy);
 return validateOfficialVisualInventory(plan,copy,pi);
};

test("all 50 installed primitives are in executable official screenshot inventory",()=>{
 const audit=validateOfficialVisualInventory(plan,manifest,pi);
 assert.deepEqual(audit.errors,[]);
 assert.deepEqual(audit.statistics,{installed:50,selected:50,pendingReview:0,comparable:41,officialOnly:9,viewports:["desktop","mobile"]});
 assert.equal(manifest.selectionPolicy.minimumSelected,50);
});
test("the twelve high-priority additions have their real existing Pi contract mappings",()=>{
 const bySlug=new Map(manifest.examples.map(item=>[item.component,item]));
 const available=new Set(pi.components.map(item=>item.type));
 for(const slug of priorities){
  const expected=slug.split("-").map(part=>part[0].toUpperCase()+part.slice(1)).join("");
  const item=bySlug.get(slug);
  assert.ok(item,"Missing priority reference: "+slug);
  assert.equal(item.docPath,"/docs/components/base/"+slug);
  assert.equal(item.exampleId,slug+"-demo");
  assert.equal(item.style,["attachment","bubble","marker","message"].includes(slug)?"base-rhea":"base-nova");
  assert.equal(item.localType,expected);
  assert.ok(available.has(expected),"Local Pi mapping not admitted: "+expected);
 }
 assert.deepEqual(manifest.excludedComponents,[]);
});
test("missing, duplicated and unknown official examples are rejected",()=>{
 assert.ok(!check(m=>m.examples.pop()).ok);
 assert.ok(check(m=>m.examples.push({...m.examples[0]})).errors.some(x=>x.includes("duplicada")));
 assert.ok(check(m=>m.examples[0].component="inventado").errors.some(x=>x.includes("não instalada")));
});
test("new exclusions remain pending, never count as audited coverage",()=>{
 const changed=check(m=>{
  const removed=m.examples.pop();
  m.excludedComponents.push({component:removed.component,reason:"Fonte ainda exige revisão visual e evidência real"});
 });
 assert.equal(changed.ok,false);
 assert.ok(changed.errors.some(x=>x.includes("insuficientes")));
 assert.ok(check(m=>m.excludedComponents.push({component:m.examples[0].component,reason:"Exclusão duplicada de exemplo selecionado"})).errors.some(x=>x.includes("capturado e excluído")));
 assert.ok(check(m=>m.excludedComponents.push({component:"other",reason:"Exclusão de referência não instalada"})).errors.some(x=>x.includes("não instalada")));
});
test("official provenance and Pi mapping must never be invented",()=>{
 assert.ok(check(m=>m.examples[0].docPath="/docs/not-official").errors.some(x=>x.includes("Caminho oficial")));
 assert.ok(check(m=>m.examples[0].localType=null).errors.some(x=>x.includes("Contrato local")));
 assert.ok(check(m=>m.upstream="https://example.com").errors.some(x=>x.includes("Domínio")));
});
test("50-example priority floor cannot be silently lowered",()=>{
 assert.ok(check(m=>m.selectionPolicy.minimumSelected=38).errors.some(x=>x.includes("piso")));
 assert.ok(check(m=>m.selectionPolicy.minimumSelected=1).errors.some(x=>x.includes("piso")));
});
