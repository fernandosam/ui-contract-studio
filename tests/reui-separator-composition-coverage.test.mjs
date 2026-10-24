import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
const prefix="src/ui-catalog/extensions/composites/reui-separator-";
const guidance=JSON.parse(readFileSync("src/ui-catalog/reui-guidance.json","utf8"));
const preview=readFileSync("src/ui-catalog/extensions/composites/reui-preview.tsx","utf8");
test("Galeria 3: prévias completas e composições separadas do Separator",()=>{
 assert.deepEqual(guidance.Separator.examples.map(([,id])=>id),Array.from({length:6},(_,i)=>`c-separator-${i+1}`));
 for(let i=1;i<=6;i++){
  assert.ok(existsSync(prefix+i+".tsx"));
  assert.match(readFileSync(prefix+i+".tsx","utf8"),new RegExp("export function SeparatorPattern"+i+"\\b"));
  assert.match(preview,new RegExp("SeparatorPattern"+i+"\\b"));
 }
});
