import test from "node:test";
import assert from "node:assert/strict";
import {createSubmissionGateway,defaultSubmissionGateway,SubmissionFailure,type ApprovedService} from "../src/ui-requirements/submission-backend";
import {createInMemoryDemoService} from "../src/ui-requirements/submission-demo";
const context={userId:"u1",tenantId:"t1",csrfVerified:true,confirmationVerified:true,actions:new Set(["users-demo"])};
const request={serviceId:"users-demo",idempotencyKey:"request_123456789",values:{name:"Ana",email:"ana@example.com"}};
test("T32: denies unauthorized sources and rejects malformed submissions",async()=>{
 const demo=createInMemoryDemoService();
 const gateway=createSubmissionGateway([demo.service]);
 await assert.rejects(defaultSubmissionGateway(request,context),/não autorizado/);
 for(const ctx of [
  {...context,csrfVerified:false},
  {...context,confirmationVerified:false},
  {...context,actions:new Set<string>()},
  {...context,tenantId:""},
  {...context,userId:""}
 ])await assert.rejects(gateway(request,ctx),(e:unknown)=>e instanceof SubmissionFailure&&e.code==="forbidden");
 await assert.rejects(gateway({...request,idempotencyKey:"bad"},context),/idempotência inválida/);
 await assert.rejects(gateway({...request,values:{name:"A",endpoint:"https://remote.test"}},context),/Nome e e-mail/);
 assert.equal(demo.records().length,0);
});
test("T32: in-memory demo requires explicit auth, blocks duplicates, and scopes tenants",async()=>{
 const demo=createInMemoryDemoService(),submit=createSubmissionGateway([demo.service]);
 const first=await submit(request,context);
 assert.equal(first.receiptId,"demo-1");
 assert.deepEqual(await submit(request,context),first);
 assert.equal(demo.records().length,1);
 await assert.rejects(submit({...request,idempotencyKey:"request_different_123"},context),
  (e:unknown)=>e instanceof SubmissionFailure&&e.code==="conflict");
 await assert.rejects(submit({...request,values:{name:"Outro",email:"ana@example.com"}},context),
  (e:unknown)=>e instanceof SubmissionFailure&&e.code==="conflict");
 assert.equal((await submit(request,{...context,tenantId:"t2"})).receiptId,"demo-2");
 assert.equal(demo.records().length,2);
});
test("T32: concurrent duplicate submissions call adapter once and conflicting payload is refused",async()=>{
 let calls=0;let unblock:(receipt:{receiptId:string})=>void=()=>{};
 const service:ApprovedService={id:"users-demo",submit:async()=>{calls++;return await new Promise(resolve=>{unblock=resolve;});}};
 const submit=createSubmissionGateway([service]);
 const a=submit(request,context),b=submit(request,context);
 await assert.rejects(submit({...request,values:{name:"Marina",email:"marina@example.com"}},context),
  (e:unknown)=>e instanceof SubmissionFailure&&e.code==="conflict");
 await Promise.resolve();await Promise.resolve();
 assert.equal(calls,1);
 unblock({receiptId:"once"});
 assert.deepEqual(await a,{receiptId:"once"});
 assert.deepEqual(await b,{receiptId:"once"});
 assert.equal(calls,1);
});
test("T32: timeout aborts the trusted adapter; errors stay generic and retry is possible",async()=>{
 let calls=0,wasAborted=false;
 const service:ApprovedService={id:"users-demo",submit:async(_v,_c,signal)=>{
  calls++;
  if(calls===1)return await new Promise((_resolve,reject)=>{
   signal.addEventListener("abort",()=>{wasAborted=true;reject(new Error("secret database detail"));},{once:true});
  });
  return {receiptId:"retry"};
 }};
 const submit=createSubmissionGateway([service],{timeoutMs:20});
 await assert.rejects(submit(request,context),(e:unknown)=>e instanceof SubmissionFailure&&e.code==="timeout");
 assert.equal(wasAborted,true);
 assert.deepEqual(await submit(request,context),{receiptId:"retry"});
 assert.equal(calls,2);
 const broken=createSubmissionGateway([{id:"users-demo",submit:async()=>{throw Error("DB password secret");}}]);
 await assert.rejects(broken(request,context),(e:unknown)=>
  e instanceof SubmissionFailure&&e.code==="unavailable"&&!e.message.includes("password"));
});
test("T32: no production network endpoint, allowlist or Pi grants are inferred",()=>{
 const adapter=createInMemoryDemoService();
 assert.equal(adapter.service.id,"users-demo");
 assert.throws(()=>createSubmissionGateway([adapter.service,adapter.service]),/Configuração/);
 assert.throws(()=>createSubmissionGateway([adapter.service],{timeoutMs:60000}),/Política/);
});
