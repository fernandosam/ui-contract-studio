import test from "node:test";
import assert from "node:assert/strict";
import {createSubmissionConfirmations} from "../src/ui-requirements/submission-confirmation";

const payload={serviceId:"users-demo",idempotencyKey:"confirmed_request_123",values:{name:"Ana",email:"ana@example.org"}};
const identity={userId:"u1",tenantId:"t1"};

test("E09: consent is explicitly issued by the host, bound to user/tenant and single-use",()=>{
 const consent=createSubmissionConfirmations();
 assert.equal(consent.consume("invalid",payload,identity),false);
 assert.equal(consent.pendingCount(),0);
 const proof=consent.issueAfterApproval(payload,identity);
 assert.equal(consent.pendingCount(),1);
 assert.equal(consent.consume(proof,payload,identity),true);
 assert.equal(consent.consume(proof,payload,identity),false);
 assert.equal(consent.pendingCount(),0);
});

test("E09: changed fields, service, idempotency key, user or tenant burn consent",()=>{
 for(const altered of [
  [{...payload,values:{...payload.values,name:"Outra"}},identity],
  [{...payload,serviceId:"other-demo"},identity],
  [{...payload,idempotencyKey:"different_request_123"},identity],
  [payload,{...identity,userId:"u2"}],
  [payload,{...identity,tenantId:"t2"}],
 ] as const){
  const consent=createSubmissionConfirmations(),proof=consent.issueAfterApproval(payload,identity);
  assert.equal(consent.consume(proof,altered[0],altered[1]),false);
  assert.equal(consent.consume(proof,payload,identity),false);
 }
});

test("E09: same canonical payload with reordered properties is accepted",()=>{
 const consent=createSubmissionConfirmations();
 const proof=consent.issueAfterApproval(payload,identity);
 assert.equal(consent.consume(proof,{...payload,values:{email:payload.values.email,name:payload.values.name}},identity),true);
});

test("E09: expired tickets and capacity constraints fail closed",()=>{
 let clock=1000;
 const consent=createSubmissionConfirmations({ttlMs:1000,maxPending:1,now:()=>clock});
 const proof=consent.issueAfterApproval(payload,identity);
 assert.throws(()=>consent.issueAfterApproval(payload,identity),/Limite/);
 clock=2000;
 assert.equal(consent.consume(proof,payload,identity),false);
 assert.equal(consent.pendingCount(),0);
 assert.ok(consent.issueAfterApproval(payload,identity));
});

test("E09: malformed requests and identities cannot receive tickets",()=>{
 const consent=createSubmissionConfirmations();
 assert.throws(()=>consent.issueAfterApproval({...payload,values:{name:"A",url:"x".repeat(2001)}},identity),/Parâmetros/);
 assert.throws(()=>consent.issueAfterApproval({...payload,idempotencyKey:"x"},identity),/Parâmetros/);
 assert.throws(()=>consent.issueAfterApproval(payload,{...identity,tenantId:""}),/Identidade/);
 assert.throws(()=>createSubmissionConfirmations({ttlMs:0}),/Política/);
});
