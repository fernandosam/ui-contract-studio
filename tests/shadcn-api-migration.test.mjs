import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,readdirSync} from "node:fs";

const read=(file)=>readFileSync(file,"utf8");
const readJSON=(file)=>JSON.parse(read(file));
const catalog=read("src/ui-catalog/catalog.ts");
const adapters=read("src/ui-catalog/components/playground.tsx");
const contracts=readJSON("src/ui-catalog/contracts.lock.json");
const plan=readJSON("shadcn-plan.json");
const specs=[...readdirSync("src/ui-screens").map(x=>"src/ui-screens/"+x),...readdirSync("src/ui-patterns").filter(x=>x.endsWith(".json")&&!x.endsWith(".meta.json")).map(x=>"src/ui-patterns/"+x)].filter(x=>x.endsWith(".json"));

test("39 contratos base em 2.0.0 e Accordion e Button em 2.1.0, 3 extensões anteriores e 54 composições restantes, 10 demonstrações inline",()=>{
 assert.equal(contracts.components.length,102);
 assert.equal(contracts.components.filter(c=>c.tier==='base'&&c.version==='2.0.0').length,39);
 assert.equal(contracts.components.filter(c=>c.name==='Accordion'&&c.version==='2.1.0').length,1);
 assert.equal(contracts.components.filter(c=>c.name==='Button'&&c.version==='2.1.0').length,1);
 assert.equal(contracts.components.filter(c=>c.tier==='extension').length,61);
 for (const name of ["DataTable","DatePicker","Field"]) assert.ok(contracts.components.some(c=>c.name===name));
});

test("o plano inclui 50 primitivas shadcn",()=>{
 const installed=plan.groups.flatMap(g=>g.items.map(i=>i.name));
 assert.equal(installed.length,50);
 for(const n of ["button","card","alert","separator","accordion","dialog","drawer","popover","tooltip","select","checkbox","switch","slider","radio-group","tabs","toggle","toggle-group","button-group","carousel","spinner","label","progress","textarea"])assert.ok(installed.includes(n),n);
});

test("API shadcn variantes públicas sem aliases antigos",()=>{
 assert.match(catalog,/"default","secondary","outline","ghost","destructive","link"/);
 assert.match(catalog,/swipeDirection: z.enum/);
 assert.match(catalog,/defaultChecked:z.boolean/);
 assert.match(catalog,/type:z.enum\(\["single","multiple"\]\)/);
 assert.doesNotMatch(catalog,/"primary","secondary","outline","danger"/);
 assert.doesNotMatch(catalog,/openPath:z.string/);
});

test("telas e padrões não usam props legadas",()=>{
 const old={Badge:["text"],Alert:["type","message"],Dialog:["openPath"],Drawer:["openPath"]};
 for(const file of specs){const spec=readJSON(file);for(const node of Object.values(spec.elements)){
  for(const key of old[node.type]??[])assert.equal(Object.hasOwn(node.props,key),false,`${file}: ${node.type}.${key}`);
  if(node.type==='Button')assert.ok(!["primary","danger"].includes(node.props.variant),`${file}: variant obsoleta`);
  if(node.type==='Badge')assert.ok(!["success","warning","danger"].includes(node.props.variant),`${file}: variant obsoleta`);
 }}
 assert.equal(specs.length,11);
});

test("registry referencia implementações shadcn e não mantém Modal manual",()=>{
 for(const name of ["ShadcnButton","ShadcnCard","ShadcnSelect","ShadcnDialog","ShadcnDrawer","ShadcnTabs","ShadcnAlert","ShadcnCheckbox","ShadcnSwitch","ShadcnToggle","ShadcnSlider","ShadcnAccordion"]){assert.ok(adapters.includes(name),name);}
 assert.doesNotMatch(adapters,/function Modal\(/);
});
