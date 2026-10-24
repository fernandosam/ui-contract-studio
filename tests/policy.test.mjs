import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync,readdirSync } from "node:fs";
import { graphErrors } from "../scripts/lib/spec-invariants.mjs";
const base=new URL("../src/ui-screens/",import.meta.url);
const read=(path)=>readFileSync(new URL(path,import.meta.url),"utf8");
const source=read("../src/ui-catalog/catalog.ts");
const definitions=source.split("export const playgroundDefinitions = {")[1].split("\n};")[0];
const baseTypes=[...definitions.matchAll(/^ {2}([A-Za-z]+): \{/gm)].map(x=>x[1]);
const allowedAll=JSON.parse(read("../src/ui-catalog/contracts.lock.json")).components.map(c=>c.name);
const actionTypes=["setState","pushState","removeState","buttonClick","formSubmit","linkClick"];
const valid=()=>({root:"root",elements:{root:{type:"Text",props:{text:"Oi",variant:"body"},children:[]}}});
test("base oficial mantém 41 tipos e não foi alterada para admitir extensões",()=>{
 assert.equal(baseTypes.length,41);
 assert.equal(new Set(baseTypes).size,41);
 assert.match(source,/\.\.\.extensionDefinitions/);
});
test("telas existentes só usam catálogo aprovado, incluindo composições",()=>{
 for(const name of readdirSync(base).filter(x=>x.endsWith(".json"))){
  const spec=JSON.parse(readFileSync(new URL(name,base),"utf8"));
  assert.deepEqual(graphErrors(spec,allowedAll,{allowedActions:actionTypes}),[],name);
 }
});
test("tipos legados não foram reintroduzidos",()=>{
 for(const name of ["Page","MetricCard","ActionLink","Divider"]){
  assert.equal(baseTypes.includes(name),false);
 }
});
test("a validação estrutural permite extensão aprovada, mas não tipo desconhecido",()=>{
 const spec=valid();spec.elements.root.type="NewTile";
 assert.match(graphErrors(spec,baseTypes).join(" "),/não registrado/);
 assert.deepEqual(graphErrors(spec,[...baseTypes,"NewTile"]),[]);
});
test("rejeita children omitido até em nós sem filhos",()=>{
 const spec=valid();delete spec.elements.root.children;
 assert.match(graphErrors(spec,baseTypes).join(" "),/children deve ser array/);
});
test("rejeita referência inválida",()=>{
 const spec=valid();spec.elements.root.children=["inexistente"];
 assert.match(graphErrors(spec,baseTypes).join(" "),/inexistente/);
});
test("rejeita órfão e ciclo",()=>{
 const spec=valid();spec.elements.orphan={type:"Text",props:{text:"x",variant:"body"}};
 assert.match(graphErrors(spec,baseTypes).join(" "),/órfão/);
 const loop=valid();loop.elements.root.children=["root"];
 assert.match(graphErrors(loop,baseTypes).join(" "),/ciclo/);
});
test("rejeita ação e evento desconhecidos",()=>{
 const spec=valid();spec.elements.root.on={press:{action:"unknown"}};
 assert.match(graphErrors(spec,baseTypes,{allowedActions:actionTypes}).join(" "),/não permitida/);
 const another=valid();another.elements.root.on={press:{action:"buttonClick"}};
 assert.match(graphErrors(another,baseTypes,{allowedActions:actionTypes,allowedEvents:{Text:{events:[]}}}).join(" "),/evento não registrado/);
});
test("aceita botão com ação permitida",()=>{
 const spec=valid();spec.elements.root={type:"Button",props:{label:"Salvar",variant:"primary",disabled:false},children:[],on:{press:{action:"buttonClick",params:{message:"Salvo"}}}};
 assert.deepEqual(graphErrors(spec,baseTypes,{allowedActions:actionTypes,allowedEvents:{Button:{events:["press"]}}}),[]);
});
test("rejeita slot inexistente e filho inválido",()=>{
 const spec=valid();spec.elements.root.slots={default:["missing"]};
 assert.match(graphErrors(spec,baseTypes).join(" "),/inexistente/);
});
