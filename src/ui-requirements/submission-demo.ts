import {SubmissionFailure,type ApprovedService} from "./submission-backend";

/** In-memory fixture for trusted Node-side integration tests only.
 * Not imported by the Pi registry and not suitable for production persistence.
 */
export function createInMemoryDemoService():{
 service:ApprovedService;
 records:()=>ReadonlyArray<{tenantId:string;name:string;email:string}>;
}{
 const database=new Map<string,{tenantId:string;name:string;email:string}>();
 const service:ApprovedService={
  id:"users-demo",
  async submit(values,context,signal){
   if(signal.aborted)throw new SubmissionFailure("timeout","Operação cancelada");
   const name=values.name?.trim(),email=values.email?.trim().toLowerCase();
   if(Object.keys(values).some(k=>!["name","email"].includes(k))||
      !name||name.length>100||!email||email.length>254||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    throw new SubmissionFailure("invalid","Nome e e-mail válidos são obrigatórios");
   const key=JSON.stringify([context.tenantId,email]);
   if(database.has(key))throw new SubmissionFailure("conflict","Registro demonstrativo duplicado");
   const record=Object.freeze({tenantId:context.tenantId,name,email});
   database.set(key,record);
   return {receiptId:"demo-"+database.size};
  }
 };
 return {service,records:()=>[...database.values()]};
}
