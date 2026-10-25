import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read=(path)=>readFileSync(new URL(path,import.meta.url),"utf8");
const manifest=JSON.parse(read("../src/ui-catalog/sources.json"));
const source=read("../src/ui-catalog/catalog.ts");
const blocks=JSON.parse(read("../src/ui-catalog/block-source-inventory.json")).blocks;
const site=JSON.parse(read("../src/ui-catalog/site-compositions-audit.json")).files.filter(x=>x.decision==="admitted");
const names=[...source.split("export const playgroundDefinitions = {")[1].split("\n};")[0].matchAll(/^ {2}([A-Za-z]+): \{/gm)].map(m=>m[1]);
test("baseline permanece 41 tipos e extensões são separadas",()=>{
 assert.equal(names.length,41);
 assert.equal(manifest.components.length,102);
 assert.deepEqual(manifest.components.map(x=>x.name).sort(),[...names,"DataTable","DatePicker","Field","BlockSidebar","AspectRatio","Kbd","Empty","ScrollArea","AlertDialog","Attachment","Bubble","ContextMenu","HoverCard","Item","Marker","Message","OnboardingChecklist","RatingDistribution","CharacterCountTextarea",...blocks.map(b=>b.id),...site.map(b=>b.type)].sort());
 assert.match(source,/\.\.\.extensionDefinitions/);
 assert.match(read("../src/ui-catalog/registry.tsx"),/\.\.\.extensionImplementations/);
});
test("Pi exige admissão completa antes do uso",()=>{
 const rule=read("../AGENTS.md"), skill=read("../.pi/skills/ui-catalog/SKILL.md");
 for(const word of ["Zod", "React", "registry", "sources.json"]){
   assert.match(rule,new RegExp(word));
   assert.match(skill,new RegExp(word));
 }
 assert.match(rule,/admission with a Zod schema \+ React component \+ registry/);
 assert.match(read("../AGENTS.pt-BR.md"),/admissão com schema Zod \+ componente React \+ registry/);
 assert.match(read("../.pi/prompts/ui.md"),/full admission/);
 assert.match(read("../.pi/prompts/ui.pt-BR.md"),/admissão completa/);
 assert.match(read("../.pi/extensions/ui-guard.ts"),/extensions\/components/);
});
