/** Explicit server-side integration boundary. It grants no Pi permission or network endpoint. */
export type SubmissionContext={
 userId:string;tenantId:string;csrfVerified:boolean;
 actions:ReadonlySet<string>;
};
export type SubmissionPayload={serviceId:string;values:Record<string,string>;idempotencyKey:string};
export type SubmissionReceipt={receiptId:string};
export type ApprovedService={
 id:string;
 submit:(values:Readonly<Record<string,string>>,context:SubmissionContext)=>Promise<SubmissionReceipt>;
};
/** Only server-provided adapters participate. Never deserialize handlers from screen JSON. */
export function createSubmissionGateway(services:readonly ApprovedService[]){
 const registry=new Map<string,ApprovedService>();
 for(const service of services){
  if(!/^[a-z][a-z0-9-]{2,60}$/.test(service.id)||registry.has(service.id))throw Error("Configuração de serviço inválida");
  registry.set(service.id,service);
 }
 const receipts=new Map<string,SubmissionReceipt>();
 return async function submit(payload:SubmissionPayload,context:SubmissionContext):Promise<SubmissionReceipt>{
  const service=registry.get(payload.serviceId);
  if(!service)throw Error("Serviço não autorizado");
  if(!context.userId||!context.tenantId||!context.csrfVerified||!context.actions.has(payload.serviceId))
   throw Error("Acesso não autorizado");
  if(!/^[a-zA-Z0-9_-]{12,120}$/.test(payload.idempotencyKey))throw Error("Chave de idempotência inválida");
  const entries=Object.entries(payload.values);
  if(!entries.length||entries.length>30)throw Error("Dados inválidos");
  for(const [field,value] of entries){
   if(!/^[a-z][a-zA-Z0-9]{0,60}$/.test(field)||typeof value!=="string"||value.length>2000)
    throw Error("Campo inválido");
  }
  const cacheKey=[context.tenantId,context.userId,payload.serviceId,payload.idempotencyKey].join(":");
  if(receipts.has(cacheKey))return receipts.get(cacheKey)!;
  try{
   const receipt=await service.submit(Object.freeze({...payload.values}),context);
   if(!receipt||typeof receipt.receiptId!=="string"||receipt.receiptId.length>120)
    throw Error("Resposta de serviço inválida");
   receipts.set(cacheKey,receipt);
   return receipt;
  }catch{
   throw Error("Falha ao processar solicitação");
  }
 };
}
/** No production adapters are registered by default. */
export const defaultSubmissionGateway=createSubmissionGateway([]);
