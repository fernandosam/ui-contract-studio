import test from "node:test";
import assert from "node:assert/strict";
import {existsSync,readFileSync} from "node:fs";
test("ReUI Badge: 25 composições TSX independentes e catalogadas",()=>{
 const guide=JSON.parse(readFileSync("src/ui-catalog/reui-guidance.json","utf8"));
 assert.deepEqual(guide.Badge.examples.map(([,id])=>id),Array.from({length:25},(_,i)=>`c-badge-${i+1}`));
 for(let i=1;i<=25;i++){
  const p=`src/ui-catalog/extensions/composites/reui-badge-${i}.tsx`;
  assert.ok(existsSync(p),p);
  const src=readFileSync(p,"utf8");
  assert.match(src,/export default function Pattern/);
  assert.ok(!src.includes("dangerouslySetInnerHTML")&&!src.includes("eval("));
 }
});
