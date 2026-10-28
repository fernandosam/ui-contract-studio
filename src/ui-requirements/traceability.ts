import {catalog,stableComponentDefinitions,stableComponentEventDescriptors,actionDefinitions} from "../ui-catalog/catalog";
import {graphErrors} from "../../scripts/lib/spec-invariants.mjs";
import type {RequirementSpec} from "./schema";
import registrationLayout from "./registration-layout.json";
import patternLayouts from "./pattern-layouts.json";
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
 const expectedSections=registrationLayout.groups.flatMap(group=>{
  const indexes=spec.fields.flatMap((field,i)=>{
   const known=("fields" in group&&group.fields?.includes(field.name))||false;
   const fallback=group.id==="additional"&&!registrationLayout.groups.some(
    g=>"fields" in g&&g.fields?.includes(field.name));
   return known||fallback?[i]:[];
  });
  return indexes.length?[{id:group.id,label:group.label,indexes}]:[];
 });
 const expectedGroups=expectedSections.map(x=>"group_"+x.id);
 const expectedAllFieldIds=spec.fields.map((_,i)=>"field_"+i);
 const actualGroups=layout?.children??[];
 let semanticPass=!!layout&&layout.type==="Stack"&&layout.props.direction==="vertical"&&
  layout.props.gap==="lg"&&JSON.stringify(actualGroups)===JSON.stringify(expectedGroups);
 for(const section of expectedSections){
  const header=nodes["heading_"+section.id];
  const controls=nodes["group_"+section.id+"_fields"];
  const wrapper=nodes["group_"+section.id];
  const wantedColumns=spec.answers.layout==="two-columns"&&section.indexes.length>=
   registrationLayout.responsive.desktopMinFields?2:1;
  const correctType=wantedColumns===2?"Grid":"Stack";
  const correctProps=correctType==="Grid"?controls?.props.columns===2:
   controls?.props.direction==="vertical";
  semanticPass=semanticPass&&!!wrapper&&wrapper.type==="Stack"&&
   JSON.stringify(wrapper.children)===JSON.stringify(["heading_"+section.id,"group_"+section.id+"_fields"])&&
   header?.type==="Heading"&&header.props.text===section.label&&header.props.level==="h3"&&
   controls?.type===correctType&&correctProps&&
   JSON.stringify(controls.children)===JSON.stringify(section.indexes.map(i=>"field_"+i));
 }
 // No hidden, duplicated or ungrouped field nodes; preserve the reading order
 // represented by the DOM tree even when columns change at the breakpoint.
 const allActualFields=expectedSections.flatMap(section=>
  nodes["group_"+section.id+"_fields"]?.children??[]);
 semanticPass=semanticPass&&allActualFields.length===expectedAllFieldIds.length&&
  new Set(allActualFields).size===expectedAllFieldIds.length&&
  expectedAllFieldIds.every(x=>allActualFields.includes(x))&&
  Object.keys(nodes).filter(x=>x.startsWith("group_")).length===expectedSections.length*2;
 const rootNode=screen?nodes[screen.root]:null;
 semanticPass=semanticPass&&!!rootNode&&rootNode.type==="Card"&&
  rootNode.props.maxWidth===registrationLayout.container.maxWidth&&
  rootNode.props.centered===registrationLayout.container.centered;
 add(entries,{id:"layout",questionId:"layout",origin:source(spec.provenance,"layout"),
  nodeIds:["form_fields",...expectedGroups],passes:semanticPass,
  explanation:"Contrato semântico: largura controlada, títulos, grupos, ordem de leitura e colunas responsivas"});
 const validation=spec.answers.validation;
 const fieldTraces=entries.filter(x=>x.id.startsWith("field:"));
 add(entries,{id:"validation",questionId:"validation",origin:source(spec.provenance,"validation"),
  nodeIds:expectedAllFieldIds,passes:validation!=="business"&&fieldTraces.every(x=>x.status!=="blocked"),
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
  const rule=patternLayouts.flows.login;
  const desired=rule.order.filter(id=>id!=="help"||answer.showHelp===true);
  const fields=answer.remember===true?["identifier","password","remember"]:["identifier","password"];
  const wrapper=nodes.root,credentials=nodes.fields;
  emit("layout",["root","fields",...desired],wrapper?.type==="Card"&&
   wrapper.props.maxWidth===rule.maxWidth&&wrapper.props.centered===rule.centered&&
   JSON.stringify(wrapper.children)===JSON.stringify(desired)&&
   credentials?.type==="Stack"&&credentials.props.direction==="vertical"&&credentials.props.gap==="md"&&
   JSON.stringify(credentials.children)===JSON.stringify(fields)&&
   nodes.action?.type==="Button"&&nodes.notice?.type==="Text",
   "Credenciais, ajuda opcional, ação e aviso em ordem semântica e cartão compacto");
  const kind=answer.identifier==="username"?"text":"email";
  emit("identifier",["identifier","password"],
   nodes.identifier?.type==="Input"&&nodes.identifier.props.type===kind&&
   nodes.password?.type==="Input"&&nodes.password.props.type==="password",
   "Inputs declarados; autenticação e sessão permanecem indisponíveis",true);
  emit("remember",answer.remember===true?["remember"]:[],
   answer.remember===true?nodes.remember?.type==="Checkbox":!nodes.remember,
   "Opção de lembrar-me sem sessão persistida",answer.remember===true);
  emit("showHelp",answer.showHelp===true?["help"]:[],answer.showHelp===true?nodes.help?.type==="Text"&&nodes.root?.children?.includes("help"):!nodes.help,
   "Texto opcional de orientação, sem autenticação real");
 }else if(spec.flow==="search"){
  const table=nodes.table,root=nodes.root;
  const rule=patternLayouts.flows.search, dateIds=[...rule.filterChildren];
  const withDates=answer.dateFilter===true;
  const required=rule.order.filter(id=>id!=="filters"||withDates);
  const filters=nodes.filters;
  const correctFilters=withDates?
   filters?.type==="Stack"&&filters.props.direction==="vertical"&&
   JSON.stringify(filters.children)===JSON.stringify(dateIds)&&
   dateIds.every(id=>nodes[id]?.type==="DatePicker"):
   !filters&&dateIds.every(id=>!nodes[id]);
  emit("layout",["root","header",...(withDates?["filters"]:[]),"table"],
   root?.type==="Stack"&&root.props.direction==="vertical"&&root.props.gap==="lg"&&
   JSON.stringify(root.children)===JSON.stringify(required)&&
   nodes.header?.type==="Heading"&&table?.type==="DataTable"&&correctFilters,
   "Título, filtros opcionais antes dos resultados e tabela em ordem de leitura");
  emit("dateFilter",withDates?dateIds:[],Boolean(correctFilters),
   "Filtros declarados antes da tabela; filtragem real ainda exige runtime",withDates);
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
  emit("showSummary",answer.showSummary===true?["summary"]:[],answer.showSummary===true?nodes.summary?.type==="Text":!nodes.summary,
   "Resumo demonstrativo sem ligação a API externa");
 }else if(spec.flow==="dashboard"){
  const isGraph=answer.view==="graphs";
  const rule=isGraph?patternLayouts.flows.dashboard.graphs:patternLayouts.flows.dashboard.kpis;
  const expected=rule.order.filter(id=>id!=="footnote"||answer.showFootnote===true);
  const root=nodes[rule.root], grid=nodes[rule.grid];
  const columns=isGraph?2:Number(answer.density);
  const cards=isGraph?["graph_bar","graph_line"]:
   columns===2?["m1-card","m2-card"]:["m1-card","m2-card","m3-card","m4-card"];
  const layoutValid=!!root&&root.type===rule.container&&
   JSON.stringify(root.children)===JSON.stringify(expected)&&
   grid?.type==="Grid"&&grid.props.columns===columns&&
   JSON.stringify(grid.children)===JSON.stringify(cards)&&
   (isGraph?
    root.props.title==="Gráficos"&&
    root.props.maxWidth==="full"&&
    nodes.graph_bar?.type==="BarGraph"&&nodes.graph_line?.type==="LineGraph":
    root.props.direction==="vertical"&&root.props.gap==="lg"&&
    nodes["overview-title"]?.type==="Heading"&&
    nodes["overview-title"].props.text===rule.heading&&
    nodes["overview-title"].props.level==="h2")&&
   (answer.showFootnote===true?nodes.footnote?.type==="Text":!nodes.footnote);
  emit("layout",[rule.root,rule.grid,...expected],layoutValid,
   "Hierarquia visual, densidade declarada e nota posterior aos indicadores, sem dependência remota");
  const n=Object.values(nodes);
  emit("view",isGraph?["graph_bar","graph_line"]:["m1","m2","m3","m4"],
   isGraph?n.some(x=>x.type==="BarGraph")&&n.some(x=>x.type==="LineGraph")&&!n.some(x=>x.type==="Metric"):
   n.some(x=>x.type==="Metric")&&!n.some(x=>x.type==="BarGraph"),
   "Visualização com dados de demonstração; legibilidade e responsividade exigem revisão",true);
  emit("showFootnote",answer.showFootnote===true?["footnote"]:[],answer.showFootnote===true?nodes.footnote?.type==="Text":!nodes.footnote,
   "Nota explícita sobre a natureza fictícia dos dados");
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
