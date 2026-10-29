/**
 * T32 server-only boundary. Construct with trusted server adapters, NEVER data from a Pi spec.
 * This module defines no HTTP route, browser action or production identity authority.
 */
export type SubmissionContext={
 userId:string;tenantId:string;csrfVerified:boolean;confirmationVerified:boolean;
 actions:ReadonlySet<string>;
};
export type SubmissionPayload={
 serviceId:string;values:Record<string,string>;idempotencyKey:string;
};
export type SubmissionReceipt={receiptId:string};
export type ApprovedService={
 id:string;
 submit:(values:Readonly<Record<string,string>>,context:SubmissionContext,signal:AbortSignal)=>Promise<SubmissionReceipt>;
};
export class SubmissionFailure extends Error{
 constructor(readonly code:"forbidden"|"invalid"|"conflict"|"timeout"|"unavailable",message:string){
  super(message);this.name="SubmissionFailure";
 }
}
const invalid=(reason:string)=>new SubmissionFailure("invalid",reason);
const forbidden=()=>new SubmissionFailure("forbidden","Serviço ou acesso não autorizado");
const safeId=/^[a-z][a-z0-9-]{2,60}$/;
const safeField=/^[a-z][a-zA-Z0-9]{0,60}$/;
export function createSubmissionGateway(services:readonly ApprovedService[],options:{timeoutMs?:number;maxReceipts?:number}={}){
 const timeoutMs=options.timeoutMs??3000,maxReceipts=options.maxReceipts??500;
 if(!Number.isSafeInteger(timeoutMs)||timeoutMs<10||timeoutMs>30000||
    !Number.isSafeInteger(maxReceipts)||maxReceipts<1||maxReceipts>10000)throw invalid("Política de limite inválida");
 const registry=new Map<string,ApprovedService>();
 for(const service of services){
  if(!safeId.test(service.id)||registry.has(service.id)||typeof service.submit!=="function")
   throw invalid("Configuração de serviço inválida");
  registry.set(service.id,service);
 }
 // Scope both completed and pending requests to trusted identity, tenant and service.
 const completed=new Map<string,{fingerprint:string;receipt:SubmissionReceipt}>();
 const pending=new Map<string,{fingerprint:string;promise:Promise<SubmissionReceipt>}>();
 return async function submit(payload:SubmissionPayload,context:SubmissionContext):Promise<SubmissionReceipt>{
  // Authorization and trusted confirmation precede deduplication and allocation.
  if(!payload||typeof payload!=="object"||!context||typeof context!=="object"||
   !safeId.test(payload.serviceId)||!registry.has(payload.serviceId)||
   typeof context.userId!=="string"||!context.userId.trim()||
   typeof context.tenantId!=="string"||!context.tenantId.trim()||
   context.userId.length>128||context.tenantId.length>128||
   context.csrfVerified!==true||context.confirmationVerified!==true||!(context.actions instanceof Set)||
   !context.actions.has(payload.serviceId))throw forbidden();
  if(typeof payload.idempotencyKey!=="string"||!/^[a-zA-Z0-9_-]{12,120}$/.test(payload.idempotencyKey))
   throw invalid("Chave de idempotência inválida");
  if(!payload.values||typeof payload.values!=="object"||Array.isArray(payload.values))throw invalid("Dados inválidos");
  const entries=Object.entries(payload.values);
  if(!entries.length||entries.length>30)throw invalid("Dados inválidos");
  for(const [field,value] of entries){
   if(!safeField.test(field)||typeof value!=="string"||value.length>2000)
    throw invalid("Campo inválido");
  }
  const snapshot=Object.fromEntries(entries);
  // Canonical deterministic comparison only. Never log field values.
  const fingerprint=JSON.stringify(Object.entries(snapshot).sort(([a],[b])=>a.localeCompare(b)));
  const key=JSON.stringify([context.tenantId,context.userId,payload.serviceId,payload.idempotencyKey]);
  const past=completed.get(key);
  if(past){
   if(past.fingerprint!==fingerprint)throw new SubmissionFailure("conflict","Chave reutilizada para dados diferentes");
   return past.receipt;
  }
  const live=pending.get(key);
  if(live){
   if(live.fingerprint!==fingerprint)throw new SubmissionFailure("conflict","Chave reutilizada para dados diferentes");
   return live.promise;
  }
  const controller=new AbortController();
  let timer:ReturnType<typeof setTimeout>|undefined;
  const deadline=new Promise<never>((_,reject)=>{
   timer=setTimeout(()=>{
    controller.abort();
    reject(new SubmissionFailure("timeout","Tempo limite de submissão excedido"));
   },timeoutMs);
  });
  const adapter=registry.get(payload.serviceId)!;
  const promise=(async()=>{
   try{
    const receipt=await Promise.race([Promise.resolve().then(()=>adapter.submit(Object.freeze(snapshot),context,controller.signal)),deadline]);
    if(!receipt||typeof receipt.receiptId!=="string"||!receipt.receiptId.trim()||receipt.receiptId.length>120)
     throw new SubmissionFailure("unavailable","Resposta de serviço inválida");
    if(completed.size>=maxReceipts)completed.delete(completed.keys().next().value!);
    completed.set(key,{fingerprint,receipt:Object.freeze({...receipt})});
    return receipt;
   }catch(error){
    if(error instanceof SubmissionFailure)throw error;
    throw new SubmissionFailure("unavailable","Falha ao processar solicitação");
   }finally{
    if(timer)clearTimeout(timer);
    pending.delete(key);
   }
  })();
  pending.set(key,{fingerprint,promise});
  return promise;
 };
}
/** No real or demo adapter can be used without explicit server-side injection. */
export const defaultSubmissionGateway=createSubmissionGateway([]);
