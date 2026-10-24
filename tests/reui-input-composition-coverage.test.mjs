import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
test('31 composições ReUI Input independentes',()=>{
 const guide=JSON.parse(readFileSync('src/ui-catalog/reui-guidance.json','utf8'));
 assert.deepEqual(guide.Input.examples.map(([,id])=>id),Array.from({length:31},(_,i)=>`c-input-${i+1}`));
 for(let i=1;i<=31;i++){
  const p=`src/ui-catalog/extensions/composites/reui-input-${i}.tsx`;
  assert.ok(existsSync(p),p);
  assert.match(readFileSync(p,'utf8'),/export default function Pattern/);
 }
});
