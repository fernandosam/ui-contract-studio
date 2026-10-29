import {SubmissionFailure,type ApprovedService} from "./submission-backend";

/** In-memory fixture for trusted Node-side tests ONLY; never use with real personal data.
 * Records expire even without further submissions when records() is accessed. This is
 * not a production database or a substitute for deletion at the host/provider.
 */
export function createInMemoryDemoService(options:{
 retentionMs?:number;maxRecords?:number;now?:()=>number;
}={}):{
 service:ApprovedService;
 records:()=>ReadonlyArray<{tenantId:string;name:string;email:string}>;
 clear:()=>void;
}{
 const retentionMs=options.retentionMs??5*60_000;
 const maxRecords=options.maxRecords??100;
 if(!Number.isSafeInteger(retentionMs)||retentionMs<1000||retentionMs>86_400_000||
    !Number.isSafeInteger(maxRecords)||maxRecords<1||maxRecords>1000||
    (options.now!==undefined&&typeof options.now!=="function"))
  throw new RangeError("Política de retenção demonstrativa inválida");
 const now=options.now??Date.now;
 type RecordData=Readonly<{tenantId:string;name:string;email:string}>;
 const database=new Map<string,{record:RecordData;expiresAt:number}>();
 let receipts=0;
 const clock=()=>{
  const current=now();
  if(!Number.isFinite(current))throw new SubmissionFailure("unavailable","Relógio de demonstração inválido");
  return current;
 };
 const prune=(current:number)=>{
  for(const [key,item] of database)if(item.expiresAt<=current)database.delete(key);
 };
 const service:ApprovedService={
  id:"users-demo",
  async submit(values,context,signal){
   if(signal.aborted)throw new SubmissionFailure("timeout","Operação cancelada");
   const name=values.name?.trim(),email=values.email?.trim().toLowerCase();
   if(Object.keys(values).some(k=>!["name","email"].includes(k))||
      !name||name.length>100||!email||email.length>254||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    throw new SubmissionFailure("invalid","Nome e e-mail válidos são obrigatórios");
   const current=clock();
   prune(current);
   const key=JSON.stringify([context.tenantId,email]);
   if(database.has(key))throw new SubmissionFailure("conflict","Registro demonstrativo duplicado");
   if(database.size>=maxRecords)throw new SubmissionFailure("unavailable","Capacidade demonstrativa excedida");
   const record=Object.freeze({tenantId:context.tenantId,name,email});
   database.set(key,{record,expiresAt:current+retentionMs});
   receipts++;
   return {receiptId:"demo-"+receipts};
  }
 };
 return {
  service,
  records:()=>{prune(clock());return [...database.values()].map(item=>item.record);},
  clear:()=>database.clear()
 };
}
