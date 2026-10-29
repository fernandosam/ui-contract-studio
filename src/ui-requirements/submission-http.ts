/**
 * T32 - opt-in, test-host-only HTTP adapter. This file NEVER starts a listener,
 * registers a Pi action, or establishes user identity. A trusted host must pass
 * both the approved services and an authenticated session resolver.
 */
import type {IncomingMessage,ServerResponse,RequestListener} from "node:http";
import {timingSafeEqual} from "node:crypto";
import {
 createSubmissionGateway,SubmissionFailure,
 type ApprovedService,type SubmissionPayload
} from "./submission-backend";

export type TrustedDemoSession={
 userId:string;tenantId:string;
 allowedServices:ReadonlySet<string>;
 csrfToken:string;
};
export type DemoHttpOptions={
 allowedOrigin:string;
 resolveSession:(bearerToken:string)=>Promise<TrustedDemoSession|null>;
 services:readonly ApprovedService[];
 /** Trusted host consumes a one-use ticket after a real user approval. */
 verifyConfirmation:(ticket:string,payload:SubmissionPayload,session:TrustedDemoSession)=>Promise<boolean>;
 timeoutMs?:number;
};

const route="/__demo__/submit";
const maxBodyBytes=8192;
const statusByCode={forbidden:403,invalid:400,conflict:409,timeout:504,unavailable:503} as const;
function equalToken(actual:string,expected:string){
 const x=Buffer.from(actual),y=Buffer.from(expected);
 return x.length>0&&x.length===y.length&&timingSafeEqual(x,y);
}
function respond(res:ServerResponse,status:number,code:string){
 if(res.headersSent)return;
 res.writeHead(status,{"content-type":"application/json; charset=utf-8","cache-control":"no-store",
  "x-content-type-options":"nosniff","referrer-policy":"no-referrer"});
 res.end(JSON.stringify({ok:false,error:code}));
}
function sessionValid(session:TrustedDemoSession|null):session is TrustedDemoSession{
 return !!session&&typeof session.userId==="string"&&!!session.userId&&
  typeof session.tenantId==="string"&&!!session.tenantId&&
  typeof session.csrfToken==="string"&&session.csrfToken.length>=16&&
  session.allowedServices instanceof Set;
}
async function receiveJson(req:IncomingMessage):Promise<SubmissionPayload>{
 const body:Buffer[]=[];let bytes=0;
 for await (const chunk of req){
  const data:Buffer=Buffer.isBuffer(chunk)?chunk:Buffer.from(chunk);
  bytes+=data.length;
  if(bytes>maxBodyBytes)throw new SubmissionFailure("invalid","Payload excede o tamanho permitido");
  body.push(data);
 }
 if(!bytes)throw new SubmissionFailure("invalid","Payload vazio");
 let input:unknown;
 try{input=JSON.parse(Buffer.concat(body).toString("utf8"));}catch{
  throw new SubmissionFailure("invalid","JSON inválido");
 }
 if(!input||Array.isArray(input)||typeof input!=="object"||
    Object.keys(input).some(k=>!["serviceId","idempotencyKey","values"].includes(k)))
  throw new SubmissionFailure("invalid","Payload inválido");
 return input as SubmissionPayload; // Detailed shape/field authorization belongs to gateway.
}
export function createControlledDemoHttpHandler(options:DemoHttpOptions):RequestListener{
 if(!/^https?:\/\/(?:127\.0\.0\.1|localhost)(?::\d+)?$/.test(options.allowedOrigin))
  throw Error("Apenas origens de demonstração no loopback são permitidas");
 if(typeof options.resolveSession!=="function")throw Error("Autenticação do hospedeiro obrigatória");
 if(typeof options.verifyConfirmation!=="function")throw Error("Verificação de confirmação do hospedeiro obrigatória");
 const submit=createSubmissionGateway(options.services,{timeoutMs:options.timeoutMs});
 return (req,res)=>{
  const handle=async()=>{
   if(!req.url||req.url.split("?")[0]!==route)return respond(res,404,"not_found");
   // Neither wildcard CORS nor requests without a known browser origin are authorized.
   if(req.headers.origin!==options.allowedOrigin)return respond(res,403,"forbidden");
   if(req.method==="OPTIONS"){
    const requestedHeaders=(req.headers["access-control-request-headers"]??"").toLowerCase();
    if(req.headers["access-control-request-method"]!=="POST"||
       requestedHeaders.split(",").map(x=>x.trim()).some(x=>!["authorization","content-type","x-csrf-token","x-action-confirmation"].includes(x)))
     return respond(res,403,"forbidden");
    res.writeHead(204,{"access-control-allow-origin":options.allowedOrigin,
     "access-control-allow-methods":"POST","access-control-allow-headers":"authorization, content-type, x-csrf-token, x-action-confirmation",
     "access-control-max-age":"0","vary":"Origin","cache-control":"no-store"});res.end();return;
   }
   if(req.method!=="POST")return respond(res,405,"method_not_allowed");
   const auth=req.headers.authorization??"";
   if(!/^Bearer [a-zA-Z0-9_-]{20,180}$/.test(auth))return respond(res,403,"forbidden");
   let session:TrustedDemoSession|null=null;
   try{session=await options.resolveSession(auth.slice(7));}catch{return respond(res,403,"forbidden");}
   if(!sessionValid(session)||
      !equalToken(String(req.headers["x-csrf-token"]??""),session.csrfToken))
    return respond(res,403,"forbidden");
   if(!/^application\/json(?:;\s*charset=utf-8)?$/i.test(req.headers["content-type"]??""))
    return respond(res,415,"unsupported_media_type");
   let payload:SubmissionPayload;
   try{payload=await receiveJson(req);}catch(e){
    if(e instanceof SubmissionFailure)return respond(res,400,"invalid");
    return respond(res,400,"invalid");
   }
   const ticket=req.headers["x-action-confirmation"];
   if(typeof ticket!=="string"||!/^[A-Za-z0-9_-]{40,128}$/.test(ticket))
    return respond(res,403,"forbidden");
   let confirmed=false;
   try{confirmed=await options.verifyConfirmation(ticket,payload,session);}catch{return respond(res,403,"forbidden");}
   if(confirmed!==true)return respond(res,403,"forbidden");
   try{
    const receipt=await submit(payload,{
     userId:session.userId,tenantId:session.tenantId,
     csrfVerified:true,confirmationVerified:true,actions:new Set(session.allowedServices)
    });
    res.writeHead(200,{"content-type":"application/json; charset=utf-8",
     "access-control-allow-origin":options.allowedOrigin,"vary":"Origin",
     "cache-control":"no-store","x-content-type-options":"nosniff"});
    res.end(JSON.stringify({ok:true,receiptId:receipt.receiptId}));
   }catch(e){
    if(e instanceof SubmissionFailure)return respond(res,statusByCode[e.code],e.code);
    return respond(res,503,"unavailable");
   }
  };
  void handle().catch(()=>respond(res,503,"unavailable"));
 };
}
