import flowDocument from "./pattern-flows.json";
import searchTemplate from "../ui-patterns/search-and-filters.json";
import dashboardKpis from "../ui-patterns/dashboard-kpis.json";
import dashboardGraphs from "../ui-patterns/dashboard-analytics.json";
import listTemplate from "../ui-patterns/crud-list.json";
import {validateFlow,validAnswer,type Answers} from "./schema";

const flows=flowDocument.flows.map(flow=>validateFlow({schemaVersion:1,...flow}));
export const supportedPatterns=flows.map(f=>({id:f.id,title:f.title}));
export type PatternRequirements={flow:string;intent:string;answers:Answers;provenance:Record<string,"explicit"|"inferred"|"default">;missing:string[]};
type Node={type:string;props:Record<string,unknown>;children:string[]};
export type PatternScreen={root:string;elements:Record<string,Node>};

export function inferPattern(text:string){
 const normalize=(value:string)=>value.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
 const matches=flows.filter(f=>f.intentKeywords.some(word=>normalize(text).includes(normalize(word))));
 return matches.length===1?matches[0].id:null;
}
export function getPatternFlow(id:string){return flows.find(flow=>flow.id===id)??null;}
export function activePatternQuestions(id:string,answers:Answers){
 const flow=getPatternFlow(id);
 if(!flow)return [];
 return flow.questions.filter(q=>!q.visibleWhen||answers[q.visibleWhen.question]===q.visibleWhen.equals);
}
/** Conservative PT-BR cues: prefilling is not authorization or implementation. */
export function inferPatternAnswers(flowId:string,intent:string):Answers{
 const words=intent.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLocaleLowerCase("pt-BR").slice(0,500);
 const found:Answers={};
 if(flowId==="login"){
  if(/\b(usuario|username)\b/.test(words)&&!/\bemail\b/.test(words))found.identifier="username";
  if(/\blembra(r)?-?me\b|\blembra(r)? acesso\b/.test(words))
   found.remember=!/\b(nao|sem)\s+lembra/.test(words);
 }else if(flowId==="search"){
  if(/\bfiltro(s)? (de )?data(s)?\b/.test(words))
   found.dateFilter=!/\bsem filtro(s)? (de )?data(s)?\b/.test(words);
  if(/\bselecao de linhas\b/.test(words))
   found.selection=!/\bsem selecao de linhas\b/.test(words);
  if(/\b10\s+(itens|registros|linhas)\b/.test(words))found.pageSize="10";
 }else if(flowId==="list"){
  if(/\bcompact(a|o)\b/.test(words))found.compact=!/\bnao compact/.test(words);
 }else if(flowId==="dashboard"){
  if(/\bgraficos?\b/.test(words)&&!/\bkpis?\b/.test(words))found.view="graphs";
  if(/\bkpis?\b/.test(words)&&!/\bgraficos?\b/.test(words))found.view="kpis";
  if(/\b(2|dois) indicadores\b/.test(words))found.density="2";
 }
 return found;
}
export function resolvePattern(id:string,provided:Answers={},intent=""):PatternRequirements{
 const flow=getPatternFlow(id);
 if(!flow)throw Error("Padrão não cadastrado");
 for(const [key,value] of Object.entries(provided)){
  const question=flow.questions.find(q=>q.id===key);
  if(!question||!validAnswer(question,value))throw Error("Resposta inválida: "+key);
 }
 const inferred=inferPatternAnswers(id,intent);
 const answers:Answers={},provenance:PatternRequirements["provenance"]={};
 for(const q of flow.questions){
  if(Object.hasOwn(provided,q.id)){answers[q.id]=provided[q.id];provenance[q.id]="explicit";}
  else if(inferred[q.id]!==undefined&&validAnswer(q,inferred[q.id])){answers[q.id]=inferred[q.id];provenance[q.id]="inferred";}
  else if(q.default!==undefined){answers[q.id]=q.default;provenance[q.id]="default";}
 }
 const visible=new Set(activePatternQuestions(id,answers).map(q=>q.id));
 for(const key of Object.keys(answers))if(!visible.has(key)){delete answers[key];delete provenance[key];}
 const missing=flow.questions.filter(q=>visible.has(q.id)&&q.required&&(answers[q.id]===undefined||
  (typeof answers[q.id]==="string"&&!String(answers[q.id]).trim()))).map(q=>q.id);
 if(typeof answers.title==="string"&&answers.title.length>120)throw Error("Título muito longo");
 return {flow:id,intent:intent.slice(0,500),answers,provenance,missing};
}
const copy=(source:unknown):PatternScreen=>JSON.parse(JSON.stringify(source)) as PatternScreen;
const removeOrphans=(spec:PatternScreen):PatternScreen=>{
 const seen=new Set<string>();
 const walk=(id:string)=>{if(seen.has(id)||!spec.elements[id])return;seen.add(id);spec.elements[id].children.forEach(walk);};
 walk(spec.root);
 for(const id of Object.keys(spec.elements))if(!seen.has(id))delete spec.elements[id];
 return spec;
};
export function generatePatternPreview(spec:PatternRequirements):PatternScreen{
 if(spec.missing.length)throw Error("Respostas obrigatórias: "+spec.missing.join(", "));
 const a=spec.answers;
 if(spec.flow==="login"){
  const kind=a.identifier==="username"?"text":"email";
  const children=["identifier","password"];
  const elements:PatternScreen["elements"]={
   root:{type:"Card",props:{title:"Acesso (demonstração)",description:"Sem autenticação ou envio real."},children:["fields","action","notice"]},
   fields:{type:"Stack",props:{direction:"vertical",gap:"md"},children},
   identifier:{type:"Input",props:{label:kind==="email"?"E-mail":"Usuário",name:"login",type:kind,placeholder:null,value:null,required:true,checks:null},children:[]},
   password:{type:"Input",props:{label:"Senha",name:"password",type:"password",placeholder:null,value:null,required:true,checks:null},children:[]},
   action:{type:"Button",props:{label:"Entrar (sem autenticar)"},children:[]},
   notice:{type:"Text",props:{text:"Exemplo visual; autenticação requer backend autorizado.",variant:"muted"},children:[]}
  };
  if(a.remember===true){elements.remember={type:"Checkbox",props:{label:"Lembrar-me (local)",name:"remember",checked:false},children:[]};children.push("remember");}
  return {root:"root",elements};
 }
 if(spec.flow==="search"){
  const view=copy(searchTemplate);
  view.elements.root.children=a.dateFilter===true?["header","table","dates","required-date"]:["header","table"];
  view.elements.table.props.selectable=a.selection===true;
  view.elements.table.props.pageSize=Number(a.pageSize);
  return removeOrphans(view);
 }
 if(spec.flow==="list"){
  const view=copy(listTemplate);
  view.elements[view.root].props.title=a.title;
  if(a.compact===true){
   const table=view.elements["users-table"];
   const rows=table.props.rows as unknown[][];
   table.props.rows=rows.slice(0,3);
  }
  return view;
 }
 if(spec.flow==="dashboard"){
  const view=copy(a.view==="graphs"?dashboardGraphs:dashboardKpis);
  if(a.view==="kpis"&&a.density==="2"){
   view.elements.stats.children=["m1-card","m2-card"];
   view.elements.stats.props.columns=2;
  }
  if(a.view==="graphs"&&a.density==="2"){
   view.elements.graph_grid.props.columns=2;
  }
  return removeOrphans(view);
 }
 throw Error("Padrão não suportado");
}
