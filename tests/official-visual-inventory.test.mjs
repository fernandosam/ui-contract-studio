import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {validateOfficialVisualInventory} from "../scripts/lib/official-visual-inventory.mjs";
const read=path=>JSON.parse(readFileSync(path,"utf8"));
const plan=read("shadcn-plan.json");
const manifest=read("scripts/official-component-examples.json");
const pi=read("pi-catalog/contracts.json");
const check=(update)=>{
 const copy=structuredClone(manifest);
 update(copy);
 return validateOfficialVisualInventory(plan,copy,pi);
};
test("curated visual inventory covers all installed primitives without pretending 50 references were captured",()=>{
 const audit=validateOfficialVisualInventory(plan,manifest,pi);
 assert.deepEqual(audit.errors,[]);
 assert.deepEqual(audit.statistics,{installed:50,selected:38,pendingReview:12,comparable:29,officialOnly:9,viewports:["desktop","mobile"]});
});
test("missing, duplicated and unknown official examples are rejected",()=>{
 assert.ok(!check(m=>m.examples.pop()).ok);
 assert.ok(check(m=>m.examples.push({...m.examples[0]})).errors.some(x=>x.includes("duplicada")));
 assert.ok(check(m=>m.examples[0].component="inventado").errors.some(x=>x.includes("não instalada")));
});
test("excluded primitives require a documented pending-review status",()=>{
 assert.ok(check(m=>m.excludedComponents.pop()).errors.some(x=>x.includes("sem seleção")));
 assert.ok(check(m=>m.excludedComponents[0].reason="pendente").errors.some(x=>x.includes("justificativa")));
 assert.ok(check(m=>m.excludedComponents[0].component=m.examples[0].component).errors.some(x=>x.includes("capturado e excluído")));
});
test("official provenance and Pi mapping must never be invented",()=>{
 assert.ok(check(m=>m.examples[0].docPath="/docs/not-official").errors.some(x=>x.includes("Caminho oficial")));
 assert.ok(check(m=>m.examples[0].localType=null).errors.some(x=>x.includes("Contrato local")));
 assert.ok(check(m=>m.upstream="https://example.com").errors.some(x=>x.includes("Domínio")));
});
test("approved 38-example floor cannot be silently lowered",()=>{
 assert.ok(check(m=>m.selectionPolicy.minimumSelected=1).errors.some(x=>x.includes("piso")));
});
