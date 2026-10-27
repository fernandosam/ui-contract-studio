import {z} from "zod";

/** REVIEW-ONLY candidate: no Pi registration, network endpoint or arbitrary callbacks. */
export const declarativeFieldSchema=z.object({
 name:z.string().regex(/^[a-z][a-zA-Z0-9]{0,59}$/),
 label:z.string().trim().min(1).max(100),
 type:z.enum(["text","email","password","tel"]),
 required:z.boolean(),
 minLength:z.number().int().min(1).max(200).optional(),
 maxLength:z.number().int().min(1).max(2000).optional(),
}).strict().refine(f=>!f.minLength||!f.maxLength||f.minLength<=f.maxLength,{message:"Invalid length limits"});
export const declarativeFormFlowSchema=z.object({
 title:z.string().trim().min(1).max(140),
 description:z.string().max(400).nullable(),
 fields:z.array(declarativeFieldSchema).min(1).max(20),
 layout:z.enum(["single","two-columns"]),
 validation:z.enum(["on-submit","on-blur","none"]),
 submitLabel:z.string().trim().min(1).max(80),
 confirmation:z.object({
  title:z.string().trim().min(1).max(140),
  description:z.string().trim().min(1).max(600),
  confirmLabel:z.string().trim().min(1).max(60)
 }).strict().nullable(),
}).strict().superRefine((form,ctx)=>{
 const seen=new Set();
 form.fields.forEach((f,i)=>{
  if(seen.has(f.name))ctx.addIssue({code:"custom",path:["fields",i,"name"],message:"Duplicate field name"});
  seen.add(f.name);
 });
});
export type DeclarativeFormFlowProps=z.infer<typeof declarativeFormFlowSchema>;

export function validateDeclarativeValues(props:DeclarativeFormFlowProps,values:Readonly<Record<string,string>>){
 const errors:Record<string,string[]>={};
 if(props.validation==="none")return errors;
 for(const field of props.fields){
  const value=values[field.name]??"";
  const messages:string[]=[];
  if(field.required&&!value.trim())messages.push("Campo obrigatório");
  if(value&&field.type==="email"&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))messages.push("E-mail inválido");
  if(value&&field.minLength&&value.length<field.minLength)messages.push("Tamanho mínimo: "+field.minLength);
  if(value&&field.maxLength&&value.length>field.maxLength)messages.push("Tamanho máximo: "+field.maxLength);
  if(messages.length)errors[field.name]=messages;
 }
 return errors;
}
