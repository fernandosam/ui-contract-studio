import {catalog,stableComponentDefinitions,stableComponentEventDescriptors,actionDefinitions} from "../ui-catalog/catalog";
import {graphErrors} from "../../scripts/lib/spec-invariants.mjs";
import type {RequirementSpec} from "./schema";
import type {PatternRequirements} from "./patterns";

type Node={type:string;props:Record<string,unknown>;children:string[]};
type Screen={root:string;elements:Record<string,Node>};
export type TraceStatus="covered-static"|"runtime-review-required"|"blocked";
export type TraceOrigin="explicit"|"inferred"|"default"|"derived";
export type RequirementTrace={
 id:string;questionId:string;origin:TraceOrigin;
 nodeIds:string[];status:TraceStatus;
 evidence:string[];explanation:string;
};
export type TraceabilityReport={
 schemaVersion:1;flow:string;structurallyValid:boolean;issues:string[];
 requirements:RequirementTrace[];runtimeTests:"not-executed";
 limitations:string[];
};
function inspect(spec:unknown){
 const parsed=catalog.validate(spec);
 const issues=graphErrors(spec,Object.keys(stableComponentDefinitions),{
  allowedActions:Object.keys(actionDefinitions),allowedEvents:stableComponentEventDescriptors
 });
 if(!parsed.success)issues.push("A estrutura não passou no catálogo Zod");
 return {screen:parsed.success?parsed.data as unknown as Screen:null,issues};
}
function source(map:Record<string,"explicit"|"inferred"|"default">,key:string):TraceOrigin{
 return map[key]??"derived";
}
function add(entries:RequirementTrace[],args:{
 id:string;questionId:string;origin:TraceOrigin;nodeIds:string[];
 passes:boolean;needsRuntime?:boolean;explanation:string;
}){
 entries.push({
  id:args.id,questionId:args.questionId,origin:args.origin,nodeIds:args.nodeIds,
  status:!args.passes?"blocked":args.needsRuntime?"runtime-review-required":"covered-static",
  evidence:args.passes?["catalog-zod","graph-invariants","static-node-assertion"]:[],
  explanation:args.explanation
 });
}
const hasNoBoundActions=(screen:Screen)=>Object.values(screen.elements).every(n=>!("on" in n)&&!("actions" in n));
/**
 * This is an independent requirements-to-nodes check, not a second call to the generator.
 * Passing it proves only the static Pi specification, never actual user interaction.
 */
export function traceRegistration(spec:RequirementSpec,generated:unknown):TraceabilityReport{
 const inspected=inspect(generated);
 const screen=inspected.screen;
 const nodes=screen?.elements??{};
 const entries:RequirementTrace[]=[];
 for(const [index,field] of spec.fields.entries()){
  const id="field_"+index;
  const actual=nodes[id];
  const native=spec.answers.validation==="native";
  const required=native&&field.required;
  const checks=actual?.props.checks;
  const goodChecks=!native || (Array.isArray(checks) &&
   (!required||checks.some(x=>x&&typeof x==="object"&&"type" in x&&x.type==="required")) &&
   (field.type!=="email"||checks.some(x=>x&&typeof x==="object"&&"type" in x&&x.type==="email")));
  const passes=!!actual&&actual.type==="Input"&&
   actual.props.name===field.name&&actual.props.label===field.label&&
   actual.props.type===field.type&&actual.props.required===required&&goodChecks;
  add(entries,{id:"field:"+field.name,questionId:"fields",origin:source(spec.provenance,field.name.startsWith("extra")?"extraFields":"fields"),
   nodeIds:[id],passes,explanation:"Nome, tipo, rótulo e exigência do campo no contrato Input"});
 }
 const layout=nodes.form_fields;
 const expectedType=spec.answers.layout==="two-columns"?"Grid":"Stack";
 const children=spec.fields.map((_,i)=>"field_"+i);
 add(entries,{id:"layout",questionId:"layout",origin:source(spec.provenance,"layout"),
  nodeIds:["form_fields"],passes:!!layout&&layout.type===expectedType&&
  JSON.stringify(layout.children)===JSON.stringify(children)&&
  (expectedType!=="Grid"||layout.props.columns===2),
  explanation:"Agrupamento e ordem dos campos na árvore JSON"});
 const validation=spec.answers.validation;
 const fieldTraces=entries.filter(x=>x.id.startsWith("field:"));
 add(entries,{id:"validation",questionId:"validation",origin:source(spec.provenance,"validation"),
  nodeIds:children,passes:validation!=="business"&&fieldTraces.every(x=>x.status!=="blocked"),
  needsRuntime:validation==="native",explanation:validation==="native"?
  "Regras presentes na spec; execução, foco e bloqueio do envio exigem verificação em navegador":
  validation==="none"?"Nenhuma regra adicional solicitada":"Validação de negócio ainda não admitida"});
 const confirmation=nodes.confirmation;
 add(entries,{id:"confirmation",questionId:"confirmation",origin:source(spec.provenance,"confirmation"),
  nodeIds:spec.answers.confirmation===true?["confirmation"]:[],
  passes:spec.answers.confirmation===true?
   !!confirmation&&confirmation.type==="AlertDialog"&&
    confirmation.props.description===spec.answers.confirmationMessage:
   !confirmation,
  needsRuntime:spec.answers.confirmation===true,
  explanation:spec.answers.confirmation===true?
   "Diálogo declarativo; o vínculo com uma submissão real não está implementado no Pi":
   "Nenhuma confirmação foi solicitada"});
 const demoOnly=spec.answers.persistence==="local-demo";
 add(entries,{id:"persistence",questionId:"persistence",origin:source(spec.provenance,"persistence"),
  nodeIds:screen?[screen.root]:[],passes:demoOnly&&!!screen&&hasNoBoundActions(screen),
  explanation:demoOnly?"Prévia sem ações de gravação; não é uma implementação de backend":
   "Integração remota indisponível sem ação autorizada"});
 if(spec.missing.length)inspected.issues.push("Decisões obrigatórias pendentes: "+spec.missing.join(", "));
 if(screen){
  const root=nodes[screen.root];
  if(!root||root.type!=="Card"||!root.children.includes("form_fields"))
   inspected.issues.push("Estrutura de cadastro divergente");
  const found=Object.keys(nodes).filter(k=>k.startsWith("field_"));
  if(found.length!==spec.fields.length)inspected.issues.push("Quantidade de campos divergente");
 }
 return finish("registration",inspected.issues,entries,[
  "Testes de execução não são certificados por inspeção da spec",
  "Validação de negócio e persistência real exigem contratos e adapters autorizados"
 ]);
}
export function tracePattern(spec:PatternRequirements,generated:unknown):TraceabilityReport{
 const inspected=inspect(generated),nodes=inspected.screen?.elements??{};
 const entries:RequirementTrace[]=[];
 const answer=spec.answers;
 const emit=(id:string,nodeIds:string[],passes:boolean,explanation:string,needsRuntime=false)=>
  add(entries,{id,questionId:id,origin:source(spec.provenance,id),nodeIds,passes,explanation,needsRuntime});
 if(spec.flow==="login"){
  const kind=answer.identifier==="username"?"text":"email";
  emit("identifier",["identifier","password"],
   nodes.identifier?.type==="Input"&&nodes.identifier.props.type===kind&&
   nodes.password?.type==="Input"&&nodes.password.props.type==="password",
   "Inputs declarados; autenticação e sessão permanecem indisponíveis",true);
  emit("remember",answer.remember===true?["remember"]:[],
   answer.remember===true?nodes.remember?.type==="Checkbox":!nodes.remember,
   "Opção de lembrar-me sem sessão persistida",answer.remember===true);
 }else if(spec.flow==="search"){
  const table=nodes.table,root=nodes.root;
  const dateIds=["dates","required-date"];
  emit("dateFilter",answer.dateFilter===true?dateIds:[],
   root?.type==="Stack"&&dateIds.every(id=>answer.dateFilter===true?
    root.children.includes(id)&&nodes[id]?.type==="DatePicker":!root.children.includes(id)&&!nodes[id]),
   "Filtros declarados; comportamento de filtragem de resultados exige runtime",answer.dateFilter===true);
  emit("selection",["table"],table?.type==="DataTable"&&table.props.selectable===answer.selection,
   "Configuração da seleção no DataTable",true);
  emit("pageSize",["table"],table?.type==="DataTable"&&table.props.pageSize===Number(answer.pageSize),
   "Paginação declarada; navegação deve ser verificada em navegador",true);
 }else if(spec.flow==="list"){
  const card=nodes["users-card"],table=nodes["users-table"];
  emit("title",["users-card"],card?.type==="Card"&&card.props.title===answer.title,
   "Título da listagem registrado no contrato Card");
  emit("compact",["users-table"],table?.type==="Table"&&Array.isArray(table.props.rows)&&
   table.props.rows.length===(answer.compact===true?3:7),
   "Quantidade de linhas demonstrativas, sem operações CRUD remotas");
 }else if(spec.flow==="dashboard"){
  const isGraph=answer.view==="graphs";
  const n=Object.values(nodes);
  emit("view",isGraph?["graph_bar","graph_line"]:["m1","m2","m3","m4"],
   isGraph?n.some(x=>x.type==="BarGraph")&&n.some(x=>x.type==="LineGraph")&&!n.some(x=>x.type==="Metric"):
   n.some(x=>x.type==="Metric")&&!n.some(x=>x.type==="BarGraph"),
   "Visualização com dados de demonstração; legibilidade e responsividade exigem revisão",true);
  if(!isGraph){
   emit("density",["stats"],nodes.stats?.type==="Grid"&&
    nodes.stats.children.length===Number(answer.density)&&nodes.stats.props.columns===Number(answer.density),
    "Contagem e agrupamento dos indicadores KPI",true);
  }
 }else inspected.issues.push("Padrão não identificado");
 if(spec.missing.length)inspected.issues.push("Decisões obrigatórias pendentes: "+spec.missing.join(", "));
 if(inspected.screen&&!hasNoBoundActions(inspected.screen))
  inspected.issues.push("Padrão declara ações não autorizadas pelo fluxo demonstrativo");
 return finish(spec.flow,inspected.issues,entries,[
  "O catálogo foi validado estaticamente; testes de navegador são evidências separadas",
  "Login, listagem e integrações remotas permanecem demonstrativos"
 ]);
}
function finish(flow:string,issues:string[],entries:RequirementTrace[],limitations:string[]):TraceabilityReport{
 const structurallyValid=issues.length===0;
 if(!structurallyValid)
  for(const entry of entries)if(entry.status!=="blocked"){
   entry.status="blocked";entry.evidence=[];
  }
 return {schemaVersion:1,flow,structurallyValid:structurallyValid&&entries.every(e=>e.status!=="blocked"),
  issues:[...issues,...entries.filter(x=>x.status==="blocked").map(x=>"Requisito não atendido: "+x.id)],
  requirements:entries,runtimeTests:"not-executed",limitations};
}
