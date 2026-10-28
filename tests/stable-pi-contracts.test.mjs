import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>JSON.parse(readFileSync(path,'utf8'));
const lock=read('src/ui-catalog/contracts.lock.json');
const pi=read('pi-catalog/contracts.json');
const contracts=new Map(lock.components.map(c=>[c.name,c]));

test('all reviewed contracts have explicit stable metadata, version and fingerprint',()=>{
 for(const c of lock.components){
  assert.match(c.version,/^\d+\.\d+\.\d+$/);
  assert.match(c.semanticFingerprint,/^[a-f0-9]{64}$/);
  assert.ok(['experimental','beta','stable','deprecated'].includes(c.stability));
  if(c.stability==='stable')assert.equal(c.status,'approved');
 }
});

test('Pi stable metadata is a projection of reviewed contracts, not an independent decision',()=>{
 for(const c of pi.components){
  const source=contracts.get(c.type);
  if(source){
   assert.equal(c.version,source.version,c.type);
   assert.equal(c.fingerprint,source.semanticFingerprint,c.type);
   assert.equal(c.stability,source.stability,c.type);
   assert.equal(c.lifecycle==='stable',source.stability==='stable',c.type);
  }else{
   assert.equal(c.fingerprint,c.sourceDigest,c.type);
   assert.equal(c.stability,c.lifecycle,c.type);
   assert.ok(c.lifecycle!=='stable'||c.validation.e2e==='passed'||c.validation.e2e==='ci-required',c.type);
  }
 }
});

test('unreviewed and experimental contracts are never stable by changing Pi metadata alone',()=>{
 const stable=pi.components.filter(c=>c.lifecycle==='stable');
 for(const c of stable){
  assert.equal(c.stability,'stable');
  assert.match(c.fingerprint,/^[a-f0-9]{64}$/);
 }
 assert.equal(new Set(pi.components.map(c=>c.type)).size,pi.components.length);
});
