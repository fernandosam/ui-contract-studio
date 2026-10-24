import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
test("ReUI Button Group: 57 composições TSX independentes",()=>{
 const guide=JSON.parse(readFileSync("src/ui-catalog/reui-guidance.json","utf8"));
 assert.deepEqual(guide.ButtonGroup.examples.map(([,id])=>id),Array.from({length:57},(_,i)=>`c-button-group-${i+1}`));
 for(let i=1;i<=57;i++){
  const p=`src/ui-catalog/extensions/composites/reui-button-group-${i}.tsx`;
  assert.ok(existsSync(p),p);
  assert.match(readFileSync(p,"utf8"),/export default function Pattern/);
 }
});
