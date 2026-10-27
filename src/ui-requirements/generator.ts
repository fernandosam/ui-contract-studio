import {planInterface} from "./planner";
import type {RequirementSpec} from "./schema";

/** Pure JSON spec generator. It does not add actions, permissions, handlers or contracts. */
export function generateRegistrationScreen(requirements:RequirementSpec) {
  const plan=planInterface(requirements);
  if(plan.blockers.length)throw Error("Geração bloqueada: "+plan.blockers.join("; "));
  const elements:Record<string,{type:string;props:Record<string,unknown>;children:string[]}>={};
  const add=(id:string,type:string,props:Record<string,unknown>,children:string[]=[])=>{
    elements[id]={type,props,children};return id;
  };
  const items=requirements.fields.map((field,i)=>{
    const checks=requirements.answers.validation==="native"?[
      ...(field.required?[{type:"required",message:"Campo obrigatório"}]:[]),
      ...(field.type==="email"?[{type:"email",message:"E-mail inválido"}]:[]),
    ]:null;
    return add("field_"+i,"Input",{
      name:field.name,label:field.label,type:field.type,placeholder:null,value:null,
      required:requirements.answers.validation==="native"&&field.required,
      checks,
    });
  });
  const layout=requirements.answers.layout==="two-columns"?"Grid":"Stack";
  const layoutProps=layout==="Grid"?{columns:2,gap:"md"}:{direction:"vertical",gap:"md",align:"stretch",justify:"start"};
  add("form_fields",layout,layoutProps,items);
  const description="Prévia declarativa. Sem gravação de dados; valide requisitos funcionais antes de publicar.";
  const children=["form_fields"];
  if(requirements.answers.confirmation===true){
    children.push(add("confirmation","AlertDialog",{
      trigger:"Revisar confirmação (demonstração)",title:"Confirmar cadastro",
      description:String(requirements.answers.confirmationMessage||"Confirmar os dados?"),
      confirmLabel:"Confirmar (sem salvar)",cancelLabel:"Cancelar",
    }));
  }else{
    children.push(add("preview_note","Text",{text:"Prévia sem envio de dados.",variant:"muted"}));
  }
  add("root","Card",{title:"Cadastro de usuários",description},children);
  return {root:"root",elements};
}
