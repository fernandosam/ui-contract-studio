import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
test('35 composições ReUI Avatar independentes',()=>{
 const guide=JSON.parse(readFileSync('src/ui-catalog/reui-guidance.json','utf8'));
 assert.deepEqual(guide.Avatar.examples.map(([,id])=>id),Array.from({length:35},(_,i)=>`c-avatar-${i+1}`));
 for(let i=1;i<=35;i++){
  const p=`src/ui-catalog/extensions/composites/reui-avatar-${i}.tsx`;
  assert.ok(existsSync(p),p);
  assert.match(readFileSync(p,'utf8'),/export default function Pattern/);
 }
});
