import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
test("ReUI Rating: 9 exemplos TSX independentes",()=>{
 const guide=JSON.parse(readFileSync("src/ui-catalog/reui-guidance.json","utf8"));
 assert.deepEqual(guide.Rating.examples.map(([,id])=>id),Array.from({length:9},(_,i)=>`c-rating-${i+1}`));
 for(let i=1;i<=9;i++){
  const p=`src/ui-catalog/extensions/composites/reui-rating-${i}.tsx`;
  assert.ok(existsSync(p),p);
  assert.match(readFileSync(p,"utf8"),/export default function Pattern/);
 }
});

test("Rating Pi usa frações de estrelas sem controles inertes em modo somente leitura",()=>{
 const renderer=readFileSync("src/ui-catalog/components/playground.tsx","utf8");
 const css=readFileSync("src/index.css","utf8");
 assert.match(renderer,/ratingStarFillPercent\(current,i,max\)/);
 assert.match(renderer,/props\.interactive === false/);
 assert.match(renderer,/className="pg-rating-static"/);
 assert.match(renderer,/aria-pressed=\{current===i\+1\}/);
 assert.match(renderer,/className="sr-only"/);
 assert.match(css,/\.pg-rating-glyph \{/);
 assert.match(css,/background-clip: text/);
});
