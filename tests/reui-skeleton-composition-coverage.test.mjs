import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
test("ReUI Skeleton: dez composições estáticas e seguras",()=>{
 const guide=JSON.parse(readFileSync("src/ui-catalog/reui-guidance.json","utf8"));
 assert.deepEqual(guide.Skeleton.examples.map(([,id])=>id),Array.from({length:10},(_,i)=>`c-skeleton-${i+1}`));
 for(let i=1;i<=10;i++){
  const f=`src/ui-catalog/extensions/composites/reui-skeleton-${i}.tsx`;
  assert.ok(existsSync(f));
  const source=readFileSync(f,"utf8");
  assert.match(source,/export default function Pattern/);
  assert.ok(!source.includes("dangerouslySetInnerHTML")&&!source.includes("eval("));
 }
});
