import test from "node:test";
import assert from "node:assert/strict";
import {createServer,type Server} from "node:http";
import {randomBytes} from "node:crypto";
import {once} from "node:events";
import {createControlledDemoHttpHandler,type TrustedDemoSession} from "../src/ui-requirements/submission-http";
import {createInMemoryDemoService} from "../src/ui-requirements/submission-demo";
import {createSubmissionConfirmations} from "../src/ui-requirements/submission-confirmation";
import {type ApprovedService} from "../src/ui-requirements/submission-backend";

const origin="http://127.0.0.1:5173";
const body={serviceId:"users-demo",idempotencyKey:"test_submission_12345",values:{name:"Ana",email:"ana@example.org"}};
const token=randomBytes(32).toString("base64url"),csrf=randomBytes(24).toString("base64url");
const session:TrustedDemoSession={userId:"test-user",tenantId:"tenant-test",allowedServices:new Set(["users-demo"]),csrfToken:csrf};
const byBase=new Map<string,ReturnType<typeof createSubmissionConfirmations>>();
async function harness(services:readonly ApprovedService[]=[],resolver=async(x:string)=>x===token?session:null,timeoutMs=3000){
 const demo=createInMemoryDemoService();
 const tickets=createSubmissionConfirmations();
 const handler=createControlledDemoHttpHandler({allowedOrigin:origin,resolveSession:resolver,
  verifyConfirmation:async(ticket,payload,identity)=>tickets.consume(ticket,payload,identity),
  services:services.length?services:[demo.service],timeoutMs});
 const server:Server=createServer(handler);
 server.listen(0,"127.0.0.1");await once(server,"listening");
 const address=server.address();
 if(!address||typeof address==="string")throw Error("Expected ephemeral TCP listener");
 const base="http://127.0.0.1:"+address.port;
 byBase.set(base,tickets);
 return {base,demo,close:async()=>{byBase.delete(base);server.close();await once(server,"close");}};
}
async function post(base:string,payload:unknown=body,options:{auth?:string;csrf?:string;origin?:string;type?:string;confirmation?:string|null}={}){
 const store=byBase.get(base);
 if(!store)throw Error("Test host not active");
 let ticket=options.confirmation;
 if(ticket===undefined){
  try{ticket=store.issueAfterApproval(payload as typeof body,session);}
  catch{ticket=store.issueAfterApproval(body,session);}
 }
 const headers:Record<string,string>={
  origin:options.origin??origin,authorization:"Bearer "+(options.auth??token),
  "x-csrf-token":options.csrf??csrf,"content-type":options.type??"application/json"
 };
 if(ticket!==null)headers["x-action-confirmation"]=ticket;
 return fetch(base+"/__demo__/submit",{method:"POST",headers,body:JSON.stringify(payload)});
}
test("T32 HTTP: authorized demonstration creates server-side record and provides idempotent receipt",async t=>{
 const h=await harness();t.after(h.close);
 const first=await post(h.base);
 assert.equal(first.status,200);
 const receipt=await first.json() as {ok:boolean;receiptId:string};
 assert.equal(receipt.ok,true);
 assert.equal(h.demo.records().length,1);
 assert.deepEqual(await (await post(h.base)).json(),receipt);
 assert.equal(h.demo.records().length,1);
 const conflict=await post(h.base,{...body,values:{name:"Maria",email:"maria@example.org"}});
 assert.equal(conflict.status,409);
 assert.deepEqual(await conflict.json(),{ok:false,error:"conflict"});
 assert.equal(h.demo.records().length,1);
});
test("E09 HTTP: replay and mutation of a confirmed write are denied before the adapter",async t=>{
 const h=await harness();t.after(h.close);
 const store=byBase.get(h.base);
 assert.ok(store);
 const proof=store.issueAfterApproval(body,session);
 assert.equal((await post(h.base,body,{confirmation:proof})).status,200);
 assert.equal((await post(h.base,body,{confirmation:proof})).status,403);
 const bound=store.issueAfterApproval(body,session);
 const changed={...body,values:{name:"Bia",email:"bia@example.org"}};
 assert.equal((await post(h.base,changed,{confirmation:bound})).status,403);
 assert.equal((await post(h.base,body,{confirmation:bound})).status,403);
 assert.equal(h.demo.records().length,1);
});

test("T32 HTTP: unknown service, duplicate e-mail and malformed fields never persist",async t=>{
 const h=await harness();t.after(h.close);
 assert.equal((await post(h.base,{...body,serviceId:"external-db"})).status,403);
 assert.equal((await post(h.base,{...body,values:{name:"",email:"bad"}})).status,400);
 assert.equal((await post(h.base,{...body,values:{name:"Ana",email:"ana@example.org",endpoint:"https://invalid.example"}})).status,400);
 assert.equal(h.demo.records().length,0);
 assert.equal((await post(h.base)).status,200);
 assert.equal((await post(h.base,{...body,idempotencyKey:"new_submission_12345"})).status,409);
 assert.equal(h.demo.records().length,1);
});
test("T32 HTTP: CORS, authentication, CSRF, content type and method remain fail-closed",async t=>{
 const h=await harness();t.after(h.close);
 assert.equal((await post(h.base,body,{auth:"Z".repeat(40)})).status,403);
 assert.equal((await post(h.base,body,{csrf:"W".repeat(32)})).status,403);
 assert.equal((await post(h.base,body,{confirmation:null})).status,403);
 assert.equal((await post(h.base,body,{confirmation:"W".repeat(43)})).status,403);
 assert.equal((await post(h.base,body,{origin:"https://evil.example"})).status,403);
 assert.equal((await post(h.base,body,{type:"text/plain"})).status,415);
 assert.equal((await fetch(h.base+"/__demo__/submit",{method:"GET",headers:{origin}})).status,405);
 assert.equal((await fetch(h.base+"/__demo__/submit",{method:"OPTIONS",headers:{origin,
  "access-control-request-method":"POST","access-control-request-headers":"authorization, content-type, x-csrf-token, x-action-confirmation"}})).status,204);
 assert.equal((await fetch(h.base+"/__demo__/submit",{method:"OPTIONS",headers:{origin,
  "access-control-request-method":"DELETE"}})).status,403);
 assert.equal((await fetch(h.base+"/missing",{method:"POST",headers:{origin}})).status,404);
 assert.equal(h.demo.records().length,0);
});
test("T32 HTTP: tenant grants come from trusted session, not untrusted JSON",async t=>{
 const h=await harness([],
  async id=>id===token?{...session,allowedServices:new Set([])}:null);
 t.after(h.close);
 assert.equal((await post(h.base)).status,403);
 assert.equal((await post(h.base,{...body,tenantId:"admin"})).status,400);
 assert.equal(h.demo.records().length,0);
});
test("T32 HTTP: timeouts and exceptions are sanitized; no partial demo writes",async t=>{
 const slow:ApprovedService={id:"users-demo",submit:async(_v,_c,signal)=>new Promise((_resolve,reject)=>{
  signal.addEventListener("abort",()=>reject(Error("private secret detail")),{once:true});
 })};
 const h=await harness([slow],async id=>id===token?session:null,30);t.after(h.close);
 const response=await post(h.base);
 assert.equal(response.status,504);
 assert.equal((await response.text()).includes("secret"),false);
 const failing=await harness([{id:"users-demo",submit:async()=>{throw Error("database password leaked");}}]);
 t.after(failing.close);
 const internal=await post(failing.base);
 assert.equal(internal.status,503);
 assert.equal((await internal.text()).includes("password"),false);
});
test("T32 HTTP: request size and malformed JSON are rejected",async t=>{
 const h=await harness();t.after(h.close);
 const headers={origin,authorization:"Bearer "+token,"x-csrf-token":csrf,"content-type":"application/json"};
 const invalid=await fetch(h.base+"/__demo__/submit",{method:"POST",headers,body:"{"});
 assert.equal(invalid.status,400);
 const oversized=await post(h.base,{...body,values:{name:"A".repeat(12000),email:"a@example.org"}});
 assert.equal(oversized.status,400);
 assert.equal(h.demo.records().length,0);
});
test("T32 HTTP: no HTTP listener or identity exists unless a trusted host instantiates it",()=>{
 assert.throws(()=>createControlledDemoHttpHandler({allowedOrigin:"https://example.com",resolveSession:async()=>null,verifyConfirmation:async()=>false,services:[]}),/loopback/);
 assert.throws(()=>createControlledDemoHttpHandler({allowedOrigin:origin,resolveSession:null as never,verifyConfirmation:async()=>false,services:[]}),/hospedeiro/);
 assert.throws(()=>createControlledDemoHttpHandler({allowedOrigin:origin,resolveSession:async()=>null,verifyConfirmation:null as never,services:[]}),/confirmação/);
});
