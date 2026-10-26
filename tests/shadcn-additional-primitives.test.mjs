import test from "node:test";
import assert from "node:assert/strict";
import {existsSync,readFileSync} from "node:fs";
const read=p=>JSON.parse(readFileSync(p,"utf8"));
test("quatro novas primitivas têm fonte, contratos, adapters e amostras",()=>{
 const sources=read("src/ui-catalog/sources.json").components;
 const lock=read("src/ui-catalog/contracts.lock.json").components;
 for(const [name,slug] of [["AspectRatio","aspect-ratio"],["Kbd","kbd"],["Empty","empty"],["ScrollArea","scroll-area"]]){
  assert.ok(sources.some(x=>x.name===name&&x.sourceUrl?.endsWith("/"+slug)));
  assert.ok(lock.some(x=>x.name===name&&x.tier==="extension"&&x.semanticFingerprint));
  for(const path of ["src/components/ui/"+slug+".tsx","src/ui-catalog/extensions/components/"+slug+".tsx","pi-catalog/examples/"+name+".json","src/ui-explorer-samples/"+name+".json"])assert.ok(existsSync(path),path);
 }
});
test("quatro primitivas novas oferecem orientações oficiais em português", () => {
 const docs=read("src/ui-catalog/shadcn-guidance.json");
 for(const name of ["AspectRatio","Kbd","Empty","ScrollArea"]){
  const guide=docs[name];
  assert.ok(guide.sourceUrl?.startsWith("https://ui.shadcn.com/docs/components/base/"));
  for(const key of ["whenUse","whenNotUse","agentNotes"]) assert.ok(Array.isArray(guide[key])&&guide[key].length>=2,name+"."+key);
 }
});

test("novas primitivas oficiais possuem fonte, exemplo, proveniência e orientações",()=>{
 const official=[["AlertDialog","alert-dialog"],["Attachment","attachment"],["Bubble","bubble"],["ContextMenu","context-menu"],["HoverCard","hover-card"],["Item","item"],["Marker","marker"],["Message","message"]];
 const manifest=read("src/ui-catalog/sources.json").components;
 const contracts=read("src/ui-catalog/contracts.lock.json").components;
 const guide=read("src/ui-catalog/shadcn-guidance.json");
 for(const [name,slug] of official){
  assert.ok(existsSync("src/components/ui/"+slug+".tsx"),slug);
  assert.ok(existsSync("src/ui-catalog/extensions/components/"+slug+".tsx"),slug);
  assert.ok(existsSync("pi-catalog/examples/"+name+".json"),name);
  assert.ok(existsSync("src/ui-explorer-samples/"+name+".json"),name);
  assert.ok(manifest.some(x=>x.name===name && x.sourceUrl?.endsWith("/"+slug)),name);
  assert.ok(contracts.some(x=>x.name===name&&x.tier==="extension"&&x.semanticFingerprint),name);
  assert.ok(guide[name]?.agentNotes?.length>=2,name);
 }
});
