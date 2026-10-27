import flowJson from "./flows/registration.json";
import {validateFlow,validAnswer,type Answers,type Answer,type Question,type RequirementSpec,type RequirementField} from "./schema";

export const registrationFlow=validateFlow(flowJson);
const fieldTypes:Record<string,RequirementField>={
  name:{name:"name",label:"Nome",type:"text",required:true},
  email:{name:"email",label:"E-mail",type:"email",required:true},
  password:{name:"password",label:"Senha",type:"password",required:true},
  phone:{name:"phone",label:"Telefone",type:"tel",required:false},
  company:{name:"company",label:"Empresa",type:"text",required:false},
  city:{name:"city",label:"Cidade",type:"text",required:false},
  document:{name:"document",label:"Documento",type:"text",required:false},
};
export function inferFlow(text:string){
  const normalized=text.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
  const matches=registrationFlow.intentKeywords.filter(x=>normalized.includes(x.normalize("NFD").replace(/[\u0300-\u036f]/g,"")));
  return matches.length?"registration":null;
}
export function defaultAnswers():Answers{
  return Object.fromEntries(registrationFlow.questions.filter(q=>q.default!==undefined).map(q=>[q.id,q.default as Answer]));
}
export function activeQuestions(answers:Answers):Question[]{
  return registrationFlow.questions.filter(q=>!q.visibleWhen||answers[q.visibleWhen.question]===q.visibleWhen.equals);
}
export function resolveAnswers(provided:Answers={},intent="Criar cadastro de usuários"):RequirementSpec {
  const known=new Map(registrationFlow.questions.map(q=>[q.id,q]));
  for(const [id,value] of Object.entries(provided)){
    const q=known.get(id);
    if(!q||!validAnswer(q,value))throw Error("Resposta inválida/desconhecida: "+id);
  }
  const answers:Answers={...defaultAnswers(),...provided};
  const visible=activeQuestions(answers);
  const allowed=new Set(visible.map(q=>q.id));
  for(const id of Object.keys(answers))if(!allowed.has(id))delete answers[id];
  const missing=visible.filter(q=>q.required && (
    (q.explicit && !Object.hasOwn(provided,q.id)) ||
    answers[q.id]===undefined ||
    (typeof answers[q.id]==="string"&&!(answers[q.id] as string).trim()) ||
    (Array.isArray(answers[q.id])&&!(answers[q.id] as string[]).length)
  )).map(q=>q.id);
  const provenance=Object.fromEntries(Object.keys(answers).map(id=>[id,Object.hasOwn(provided,id)?"explicit":"default"])) as RequirementSpec["provenance"];
  const fields=(answers.fields as string[]||[]).map(id=>({...fieldTypes[id]}));
  const extras=String(answers.extraFields||"").split(/[\r\n]+/).map(x=>x.trim()).filter(Boolean);
  if(extras.length>10)throw Error("Limite de 10 campos extras excedido");
  if(new Set(extras.map(x=>x.toLocaleLowerCase("pt-BR"))).size!==extras.length)throw Error("Rótulos de campos extras duplicados");
  for(const [i,label] of extras.entries()){
    if(label.length>80)throw Error("Nome de campo muito longo");
    const name="extra"+(i+1);
    fields.push({name,label,type:"text",required:false});
  }
  return {schemaVersion:1,flow:"registration",answers,provenance,fields,missing,intent:intent.slice(0,500)};
}
