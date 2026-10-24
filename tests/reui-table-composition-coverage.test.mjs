import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
test('17 composições ReUI Table catalogadas e separadas',()=>{
 const guide=JSON.parse(readFileSync('src/ui-catalog/reui-guidance.json','utf8'));
 assert.deepEqual(guide.Table.examples.map(([,id])=>id),Array.from({length:17},(_,i)=>`c-table-${i+1}`));
 for(let i=1;i<=17;i++){
  const p=`src/ui-catalog/extensions/composites/reui-table-${i}.tsx`;
  assert.ok(existsSync(p),p);
  assert.match(readFileSync(p,'utf8'),/export default function Pattern/);
 }
});
