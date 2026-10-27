import test from "node:test";
import assert from "node:assert/strict";
import {createSubmissionGateway,defaultSubmissionGateway} from "../src/ui-requirements/submission-backend";
const context={userId:"u1",tenantId:"t1",csrfVerified:true,actions:new Set(["users-demo"])};
const request={serviceId:"users-demo",idempotencyKey:"request_123456789",values:{name:"Ana"}};
test("T32 denies unknown service",async()=>{await assert.rejects(defaultSubmissionGateway(request,context),/não autorizado/);});
test("T32 scoped adapter is idempotent",async()=>{
 let count=0;
 const gateway=createSubmissionGateway([{id:"users-demo",submit:async()=>({receiptId:String(++count)})}]);
 await gateway(request,context);await gateway(request,context);
 assert.equal(count,1);
});
