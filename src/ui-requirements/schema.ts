import { z } from "zod";

const key = z.string().regex(/^[a-z][a-zA-Z0-9]*$/);
const scalar = z.union([z.string(),z.boolean(),z.array(z.string())]);
export const questionSchema=z.object({
  id:key,label:z.string().min(1),type:z.enum(["select","boolean","text","multi-select"]),
  required:z.boolean(),explicit:z.boolean().optional(),default:scalar.optional(),
  options:z.array(z.object({value:z.string().min(1),label:z.string().min(1)}).strict()).optional(),
  visibleWhen:z.object({question:key,equals:z.union([z.string(),z.boolean()])}).strict().optional(),
}).strict();
export const flowSchema=z.object({
  schemaVersion:z.literal(1),id:key,title:z.string().min(1),
  intentKeywords:z.array(z.string().min(2)).min(1),
  questions:z.array(questionSchema).min(1),
}).strict();
export type Question=z.infer<typeof questionSchema>;
export type Flow=z.infer<typeof flowSchema>;
export type Answer=string|boolean|string[];
export type Answers=Record<string,Answer>;
export type RequirementField={name:string;label:string;type:"text"|"email"|"password"|"tel";required:boolean};
export type RequirementSpec={
  schemaVersion:1;flow:"registration";answers:Answers;
  provenance:Record<string,"explicit"|"default">;
  fields:RequirementField[];missing:string[];intent:string;
};
export function validateFlow(value:unknown):Flow {
  const flow=flowSchema.parse(value),seen=new Set<string>();
  for(const q of flow.questions){
    if(seen.has(q.id))throw Error("Pergunta duplicada: "+q.id);
    seen.add(q.id);
    if((q.type==="select"||q.type==="multi-select")&&(!q.options?.length||new Set(q.options.map(o=>o.value)).size!==q.options.length))
      throw Error("Opções inválidas: "+q.id);
    if(q.visibleWhen && !seen.has(q.visibleWhen.question))throw Error("Condição deve referenciar pergunta anterior: "+q.id);
    if(q.default!==undefined && !validAnswer(q,q.default))throw Error("Padrão inválido: "+q.id);
  }
  return flow;
}
export function validAnswer(q:Question,value:unknown):value is Answer {
  if(q.type==="boolean")return typeof value==="boolean";
  if(q.type==="text")return typeof value==="string" && value.length<=2000;
  if(q.type==="select")return typeof value==="string" && !!q.options?.some(o=>o.value===value);
  return Array.isArray(value) && value.length<=20 && value.every(x=>typeof x==="string"&&q.options?.some(o=>o.value===x))&&new Set(value).size===value.length;
}
