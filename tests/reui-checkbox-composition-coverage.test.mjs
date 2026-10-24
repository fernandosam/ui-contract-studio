import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
test("ReUI Checkbox: 22 composições independentes",()=>{
 const guide=JSON.parse(readFileSync("src/ui-catalog/reui-guidance.json","utf8"));
 assert.deepEqual(guide.Checkbox.examples.map(([,id])=>id),Array.from({length:22},(_,i)=>`c-checkbox-${i+1}`));
 for(let i=1;i<=22;i++){
  const p=`src/ui-catalog/extensions/composites/reui-checkbox-${i}.tsx`;
  assert.ok(existsSync(p));
  assert.match(readFileSync(p,"utf8"),/export default function Pattern/);
 }
});
