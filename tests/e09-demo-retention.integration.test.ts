import test from "node:test";
import assert from "node:assert/strict";
import {createInMemoryDemoService} from "../src/ui-requirements/submission-demo";
import {SubmissionFailure} from "../src/ui-requirements/submission-backend";

const context={userId:"test",tenantId:"tenant",csrfVerified:true,actions:new Set(["users-demo"])};
const signal=new AbortController().signal;
const values={name:"Pessoa Fictícia",email:"ficticia@example.invalid"};

test("E09: demo personal records expire and may be explicitly cleared",async()=>{
 let time=1000;
 const demo=createInMemoryDemoService({retentionMs:2000,now:()=>time});
 assert.deepEqual(await demo.service.submit(values,context,signal),{receiptId:"demo-1"});
 assert.equal(demo.records().length,1);
 time=2999;
 assert.equal(demo.records().length,1);
 time=3000;
 assert.equal(demo.records().length,0);
 assert.deepEqual(await demo.service.submit(values,context,signal),{receiptId:"demo-2"});
 demo.clear();
 assert.equal(demo.records().length,0);
});

test("E09: demo hard cap fails closed instead of silently evicting live data",async()=>{
 let time=1000;
 const demo=createInMemoryDemoService({maxRecords:1,retentionMs:1000,now:()=>time});
 await demo.service.submit(values,context,signal);
 await assert.rejects(demo.service.submit({...values,email:"other@example.invalid"},context,signal),
  (error:unknown)=>error instanceof SubmissionFailure&&error.code==="unavailable");
 assert.equal(demo.records().length,1);
 time=2000;
 assert.equal(demo.records().length,0);
 assert.deepEqual(await demo.service.submit({...values,email:"other@example.invalid"},context,signal),{receiptId:"demo-2"});
});

test("E09: invalid retention and caps fail before the service is available",()=>{
 for(const options of [{retentionMs:0},{retentionMs:86400001},{maxRecords:0},{maxRecords:1001},{now:123 as never}])
  assert.throws(()=>createInMemoryDemoService(options),/Política de retenção/);
});
