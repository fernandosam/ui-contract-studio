/**
 * One-use, request-bound consent tickets for a trusted HTTP host.
 * Only the host may issue a ticket AFTER a real user confirmation.
 * Generated JSON, renderer events and the Pi action registry never call issue().
 */
import {randomBytes} from "node:crypto";
import type {SubmissionPayload} from "./submission-backend";

type Identity={userId:string;tenantId:string};
const ticketFormat=/^[A-Za-z0-9_-]{40,128}$/;
const safeId=/^[a-z][a-z0-9-]{2,60}$/;
const safeField=/^[a-z][a-zA-Z0-9]{0,60}$/;
const unsafeFieldNames=new Set(["__proto__","prototype","constructor"]);
function identityKey(identity:Identity){
 if(!identity||typeof identity.userId!=="string"||!identity.userId.trim()||
   typeof identity.tenantId!=="string"||!identity.tenantId.trim()||
   identity.userId.length>128||identity.tenantId.length>128)
  throw Error("Identidade de confirmação inválida");
 return JSON.stringify([identity.userId,identity.tenantId]);
}
function requestKey(payload:SubmissionPayload){
 if(!payload||typeof payload!=="object"||Array.isArray(payload)||
   typeof payload.serviceId!=="string"||!safeId.test(payload.serviceId)||
   typeof payload.idempotencyKey!=="string"||!/^[A-Za-z0-9_-]{12,120}$/.test(payload.idempotencyKey)||
   !payload.values||typeof payload.values!=="object"||Array.isArray(payload.values))
  throw Error("Parâmetros de confirmação inválidos");
 const entries=Object.entries(payload.values);
 if(!entries.length||entries.length>30||entries.some(([key,value])=>
   (!safeField.test(key)||unsafeFieldNames.has(key))||typeof value!=="string"||value.length>2000))
  throw Error("Parâmetros de confirmação inválidos");
 // Canonical content: JSON property insertion order does not affect the ticket.
 return JSON.stringify([payload.serviceId,payload.idempotencyKey,
  entries.sort(([a],[b])=>a.localeCompare(b))]);
}

export function createSubmissionConfirmations(options:{ttlMs?:number;maxPending?:number;now?:()=>number}={}){
 const ttlMs=options.ttlMs??90000,maxPending=options.maxPending??200;
 if(!Number.isSafeInteger(ttlMs)||ttlMs<1000||ttlMs>300000||
   !Number.isSafeInteger(maxPending)||maxPending<1||maxPending>10000||
   (options.now!==undefined&&typeof options.now!=="function"))
  throw Error("Política de confirmação inválida");
 const now=options.now??Date.now;
 const pending=new Map<string,{identity:string;request:string;expires:number}>();
 function prune(){
  for(const [ticket,record] of pending)if(record.expires<=now())pending.delete(ticket);
 }
 return {
  /** Trusted host calls this ONLY on explicit user approval, not on form generation. */
  issueAfterApproval(payload:SubmissionPayload,identity:Identity):string{
   const request=requestKey(payload),principal=identityKey(identity);
   prune();
   if(pending.size>=maxPending)throw Error("Limite de confirmações pendentes");
   const ticket=randomBytes(32).toString("base64url");
   pending.set(ticket,{identity:principal,request,expires:now()+ttlMs});
   return ticket;
  },
  /** Verify and consume atomically; even wrong payloads burn the ticket. */
  consume(ticket:unknown,payload:SubmissionPayload,identity:Identity):boolean{
   if(typeof ticket!=="string"||!ticketFormat.test(ticket))return false;
   const record=pending.get(ticket);
   if(!record)return false;
   pending.delete(ticket);
   if(record.expires<=now())return false;
   try{return record.identity===identityKey(identity)&&record.request===requestKey(payload);}
   catch{return false;}
  },
  /** No tickets or user data are exposed to generated specs. */
  pendingCount():number{prune();return pending.size;},
 };
}
