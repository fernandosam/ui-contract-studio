import {catalog,stableComponentDefinitions,stableComponentEventDescriptors,actionDefinitions} from "../ui-catalog/catalog";
import {graphErrors} from "../../scripts/lib/spec-invariants.mjs";
import {planRegistrationLayout} from "./registration-layout";
import {planPatternLayout} from "./pattern-layout";
import {evaluateLayoutQuality,type LayoutQualityReport} from "./layout-quality";
import {traceRegistration,tracePattern} from "./traceability";
import type {RequirementSpec} from "./schema";
import type {PatternRequirements} from "./patterns";

type Context=RequirementSpec|PatternRequirements;
type Node={type:string;props:Record<string,unknown>;children:string[]};
type Screen={root:string;elements:Record<string,Node>;[key:string]:unknown};
type EditableProp="direction"|"gap"|"columns"|"maxWidth"|"centered";
export type LayoutRepairEdit={
 path:string;nodeId:string;before:unknown;after:unknown;
 reason:string;
};
export type LayoutRepairResult={
 schemaVersion:1;
 status:"unchanged"|"improved"|"not-applicable";
 screen:unknown;
 before:LayoutQualityReport|null;after:LayoutQualityReport|null;
 edits:LayoutRepairEdit[];
 reason:string;
 policy:"advisory-only";runtimeEvidence:"not-executed";
};

const MAX_EDITS=12;
const equal=(a:unknown,b:unknown)=>JSON.stringify(a)===JSON.stringify(b);
const sameMembers=(actual:readonly string[],expected:readonly string[])=>
 actual.length===expected.length&&equal([...actual].sort(),[...expected].sort());

/**
 * Bounded, fail-closed, in-memory repair of layout-only deviations.
 * Never creates nodes, changes node types, adds props, or changes actions/content.
 * Candidate must pass both the admitted Pi catalog and the independent trace.
 */
export function improveLayoutQuality(requirements:Context,generated:unknown):LayoutRepairResult{
 const before=evaluateLayoutQuality(requirements,generated);
 const finish=(screen:unknown,status:LayoutRepairResult["status"],edits:LayoutRepairEdit[],
  reason:string,after:LayoutQualityReport|null=before):LayoutRepairResult=>({
  schemaVersion:1,status,screen,before,after,edits,reason,
  policy:"advisory-only",runtimeEvidence:"not-executed"
 });
 if(!before)return finish(generated,"not-applicable",[],"Família sem contrato de layout reparável.");
 if(before.score===100)return finish(generated,"unchanged",[],"Layout sem divergências estáticas.");
 if(!catalog.validate(generated).success||
   graphErrors(generated,Object.keys(stableComponentDefinitions),{
    allowedActions:Object.keys(actionDefinitions),allowedEvents:stableComponentEventDescriptors
   }).length)
  return finish(generated,"not-applicable",[],
   "Spec inválida: reparo de layout não substitui validação Zod nem regras de autorização.");
 if(!generated||typeof generated!=="object"||Array.isArray(generated))
  return finish(generated,"not-applicable",[],"Árvore JSON indisponível.");

 const candidate=structuredClone(generated) as Screen;
 const nodes=candidate.elements;
 if(!nodes||!nodes[candidate.root])
  return finish(generated,"not-applicable",[],"Raiz ou nós ausentes.");
 const edits:LayoutRepairEdit[]=[];
 const get=(id:string,type:string)=>nodes[id]?.type===type?nodes[id]:null;
 const replaceChildren=(id:string,type:string,desired:readonly string[],reason:string)=>{
  const node=get(id,type);
  if(!node||equal(node.children,desired)||!sameMembers(node.children,desired))return;
  edits.push({path:"elements."+id+".children",nodeId:id,before:[...node.children],
   after:[...desired],reason});
  node.children=[...desired];
 };
 const replaceProp=(id:string,type:string,key:EditableProp,value:unknown,reason:string)=>{
  const node=get(id,type);
  if(!node||!Object.hasOwn(node.props,key)||equal(node.props[key],value))return;
  edits.push({path:"elements."+id+".props."+key,nodeId:id,before:node.props[key],after:value,reason});
  node.props[key]=value;
 };
 const props=(id:string,type:string,values:Partial<Record<EditableProp,unknown>>,reason:string)=>{
  for(const [key,value] of Object.entries(values))
   replaceProp(id,type,key as EditableProp,value,reason);
 };
 if(requirements.flow==="registration"){
  let plan:ReturnType<typeof planRegistrationLayout>;
  try{plan=planRegistrationLayout(requirements.fields,requirements.answers.layout);}
  catch{return finish(generated,"not-applicable",[],"Plano de cadastro inválido.");}
  replaceChildren("root","Card",["form_fields",
   requirements.answers.confirmation===true?"confirmation":"preview_note"],"Ordem de leitura do cadastro");
  props("root","Card",{maxWidth:"md",centered:true},"Largura semântica do formulário");
  replaceChildren("form_fields","Stack",plan.groups.map(x=>"group_"+x.id),"Ordenação dos grupos");
  props("form_fields","Stack",{direction:"vertical",gap:"lg"},"Fluxo vertical entre seções");
  for(const group of plan.groups){
   const id="group_"+group.id,fieldsId=id+"_fields";
   replaceChildren(id,"Stack",["heading_"+group.id,fieldsId],"Título antes dos campos");
   props(id,"Stack",{direction:"vertical",gap:"sm"},"Espaçamento entre título e campos");
   replaceChildren(fieldsId,group.columns===2?"Grid":"Stack",
    group.fieldIndexes.map(index=>"field_"+index),"Ordem dos campos");
   props(fieldsId,group.columns===2?"Grid":"Stack",
    group.columns===2?{columns:2,gap:"md"}:{direction:"vertical",gap:"md"},
    "Densidade e espaçamento autorizados pelo perfil");
  }
 }else{
  const plan=planPatternLayout(requirements);
  if(!plan)return finish(generated,"not-applicable",[],"Perfil de padrão não disponível.");
  if(requirements.flow==="login"){
   replaceChildren("root","Card",plan.regions,"Credenciais antes da ação e aviso");
   props("root","Card",{maxWidth:"md",centered:true},"Contêiner compacto de login");
   replaceChildren("fields","Stack",["identifier","password",
    ...(requirements.answers.remember===true?["remember"]:[])],"Ordem dos campos de login");
   props("fields","Stack",{direction:"vertical",gap:"md"},"Agrupamento de credenciais");
  }else if(requirements.flow==="search"){
   replaceChildren("root","Stack",plan.regions,"Filtros antes dos resultados");
   props("root","Stack",{direction:"vertical",gap:"lg"},"Hierarquia de busca");
   if(requirements.answers.dateFilter===true){
    replaceChildren("filters","Stack",["dates","required-date"],"Leitura dos filtros de datas");
    props("filters","Stack",{direction:"vertical",gap:"md"},"Agrupamento dos filtros");
   }
  }else if(requirements.flow==="dashboard"){
   const graphs=plan.variant==="graphs";
   const root=graphs?"graphs":"dashboard",rootType=graphs?"Card":"Stack";
   replaceChildren(root,rootType,plan.regions,"Regiões do dashboard");
   props(root,rootType,graphs?{maxWidth:"full",centered:false}:{direction:"vertical",gap:"lg"},
    "Hierarquia responsiva do dashboard");
   const grid=graphs?"graph_grid":"stats";
   const columns=graphs?2:plan.gridColumns;
   const content=graphs?["graph_bar","graph_line"]:
    columns===2?["m1-card","m2-card"]:["m1-card","m2-card","m3-card","m4-card"];
   replaceChildren(grid,"Grid",content,"Ordem de leitura dos indicadores");
   props(grid,"Grid",{columns,gap:"md"},"Densidade e intervalo declarados");
  }
 }
 if(!edits.length)
  return finish(generated,"unchanged",[],"Diagnósticos não têm reparo seguro permitido.");
 if(edits.length>MAX_EDITS)
  return finish(generated,"not-applicable",[],
   "Limite de ajustes excedido; nenhuma mudança automática aplicada.");
 // Independent policy validation; the score never serves as an admission authority.
 if(!catalog.validate(candidate).success||
   graphErrors(candidate,Object.keys(stableComponentDefinitions),{
    allowedActions:Object.keys(actionDefinitions),allowedEvents:stableComponentEventDescriptors
   }).length)
  return finish(generated,"not-applicable",[],"Candidato não passou nos contratos Pi.");
 const trace=requirements.flow==="registration"?
  traceRegistration(requirements,candidate):tracePattern(requirements,candidate);
 if(!trace.structurallyValid)
  return finish(generated,"not-applicable",[],
   "Candidato não satisfez a rastreabilidade independente dos requisitos.");
 const after=evaluateLayoutQuality(requirements,candidate);
 if(!after||after.score<=before.score||
   (Object.keys(after.scores) as (keyof typeof after.scores)[]).some(k=>after.scores[k]<before.scores[k]))
  return finish(generated,"not-applicable",[],"Ajuste não melhorou a nota sem regressões.");
 return finish(candidate,"improved",edits,"Ajustes em memória com contratos e rastreabilidade válidos.",after);
}
