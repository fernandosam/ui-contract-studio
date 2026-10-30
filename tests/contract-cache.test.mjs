import test from 'node:test';
import assert from 'node:assert/strict';
import {createContractVersionedCache} from '../src/ui-runtime/contract-cache.mjs';

const fp = digit => digit.repeat(64);
const contract = (version='1.0.0',fingerprint=fp('a')) =>
  ({name:'Button',version,fingerprint});
const request = (contracts=[contract()],key='public-guidance') => ({
  scope:'public-contract-derived',namespace:'catalog-discovery',key,contracts,
});

test('public reviewed metadata is cached as defensive copies',()=>{
 const cache=createContractVersionedCache();
 const key=request();
 const original=[{name:'Button',tokens:['ação']}];
 assert.equal(cache.set(key,original),true);
 original[0].tokens.push('poisoned');
 const first=cache.get(key);
 assert.deepEqual(first,[{name:'Button',tokens:['ação']}]);
 first[0].name='corrupted';
 assert.equal(cache.get(key)[0].name,'Button');
});

test('version-only OR fingerprint-only changes invalidate entries immediately',()=>{
 const cache=createContractVersionedCache();
 const original=request();
 cache.set(original,{answer:1});
 assert.deepEqual(cache.get(original),{answer:1});
 assert.equal(cache.get(request([contract('1.0.1')])),undefined);
 assert.equal(cache.size(),0);
 cache.set(original,{answer:2});
 assert.equal(cache.get(request([contract('1.0.0',fp('b'))])),undefined);
 assert.equal(cache.size(),0);
});

test('changes to any dependency invalidate a multi-contract index',()=>{
 const cache=createContractVersionedCache();
 const two={name:'Card',version:'2.0.0',fingerprint:fp('c')};
 const original=request([contract(),two]);
 cache.set(original,['old']);
 assert.equal(cache.get(request([contract(),{...two,fingerprint:fp('d')} ])),undefined);
 assert.equal(cache.size(),0);
});

test('semantic guidance changes never reuse an old source-specific index',()=>{
 const cache=createContractVersionedCache();
 cache.set(request([contract()],'guidance=A'),['A']);
 assert.equal(cache.get(request([contract()],'guidance=B')),undefined);
 cache.set(request([contract()],'guidance=B'),['B']);
 assert.deepEqual(cache.get(request([contract()],'guidance=B')),['B']);
});

test('TTL, LRU size, access order and explicit clearing are bounded',()=>{
 let time=100;
 const cache=createContractVersionedCache({maxEntries:2,ttlMs:10,now:()=>time});
 cache.set(request([contract()],'one'),1);
 cache.set(request([contract()],'two'),2);
 assert.equal(cache.get(request([contract()],'one')),1);
 cache.set(request([contract()],'three'),3);
 assert.equal(cache.get(request([contract()],'two')),undefined);
 assert.equal(cache.size(),2);
 time=110;
 assert.equal(cache.get(request([contract()],'one')),undefined);
 assert.equal(cache.size(),0);
 cache.set(request(),9);
 cache.clear();
 assert.equal(cache.size(),0);
});

test('missing, invalid or private metadata fails closed; unsupported values are not stored',()=>{
 const cache=createContractVersionedCache();
 const good=request();
 for(const invalid of [
  {...good,scope:'private'},
  {...good,contracts:[]},
  {...good,contracts:[{...contract(),fingerprint:'unknown'}]},
  {...good,contracts:[{...contract(),version:'latest'}]},
  {...good,contracts:[contract(),contract()]},
  {...good,namespace:'../../unsafe'},
 ]) {
  assert.equal(cache.set(invalid,'bad'),false);
  assert.equal(cache.get(invalid),undefined);
 }
 assert.equal(cache.set(good,{secret:()=>{}}),false);
 assert.equal(cache.set(good,undefined),false);
 assert.equal(cache.size(),0);
 assert.throws(()=>createContractVersionedCache({maxEntries:0}),/limits/);
 assert.throws(()=>createContractVersionedCache({ttlMs:0}),/limits/);
});
