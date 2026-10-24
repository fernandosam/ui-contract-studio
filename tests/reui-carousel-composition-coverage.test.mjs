import test from "node:test";
import assert from "node:assert/strict";
import {existsSync,readFileSync} from "node:fs";
test("ReUI Carousel: 11 previews separados",()=>{
 const g=JSON.parse(readFileSync("src/ui-catalog/reui-guidance.json","utf8"));
 assert.deepEqual(g.Carousel.examples.map(([,id])=>id),Array.from({length:11},(_,i)=>`c-carousel-${i+1}`));
 for(let i=1;i<=11;i++){
  const p=`src/ui-catalog/extensions/composites/reui-carousel-${i}.tsx`;
  assert.ok(existsSync(p));
  assert.match(readFileSync(p,"utf8"),/export default function Pattern/);
 }
});
