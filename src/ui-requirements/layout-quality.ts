import {planRegistrationLayout} from "./registration-layout";
import {planPatternLayout} from "./pattern-layout";
import type {RequirementField,Answers} from "./schema";
import type {PatternRequirements} from "./patterns";

type Flow="registration"|"login"|"search"|"dashboard";
type Dimension="hierarchy"|"grouping"|"density"|"responsiveness";
const dimensions:readonly Dimension[]=["hierarchy","grouping","density","responsiveness"];
type Node={type:string;props:Record<string,unknown>;children:string[]};
type Screen={root:string;elements:Record<string,Node>};
export type LayoutQualityFinding={
 dimension:Dimension;code:string;nodeIds:string[];deduction:number;
 message:string;suggestion:string;
};
export type LayoutQualityReport={
 schemaVersion:1;flow:Flow;score:number;maxScore:100;
 scores:Record<Dimension,number>;findings:LayoutQualityFinding[];
 basis:"static-declarative";runtimeEvidence:"not-executed";
 policy:"advisory-only";limitations:string[];
};
type Context={flow:string;answers:Answers;fields?:readonly RequirementField[]};
const same=(a:unknown,b:unknown)=>JSON.stringify(a)===JSON.stringify(b);
const record=(value:unknown):value is Record<string,unknown>=>
 !!value&&typeof value==="object"&&!Array.isArray(value);
const vertical=(node:Node|undefined)=>node?.type==="Stack"&&node.props.direction==="vertical";
const hasLabel=(node:Node|undefined)=>typeof node?.props.label==="string"&&!!node.props.label.trim();
const knownFlows=new Set<Flow>(["registration","login","search","dashboard"]);

/** Traverses only referenced nodes and never assumes that a JSON graph is acyclic. */
function parseScreen(value:unknown):Screen|null{
 if(!record(value)||typeof value.root!=="string"||!record(value.elements))return null;
 const nodes:Record<string,Node>={};
 for(const [id,raw] of Object.entries(value.elements)){
  if(!record(raw)||typeof raw.type!=="string"||!record(raw.props)||
   !Array.isArray(raw.children)||!raw.children.every(x=>typeof x==="string"))return null;
  nodes[id]={type:raw.type,props:raw.props,children:raw.children};
 }
 if(!nodes[value.root])return null;
 return {root:value.root,elements:nodes};
}
function graphSummary(screen:Screen){
 const visited=new Set<string>(),active=new Set<string>(),parents=new Map<string,number>();
 let sound=true;
 const walk=(id:string)=>{
  if(active.has(id)){sound=false;return;}
  if(visited.has(id))return;
  const node=screen.elements[id];
  if(!node){sound=false;return;}
  visited.add(id);active.add(id);
  for(const child of node.children){
   const count=(parents.get(child)??0)+1;
   parents.set(child,count);
   if(count>1||child===screen.root)sound=false;
   walk(child);
  }
  active.delete(id);
 };
 walk(screen.root);
 return {sound:sound&&visited.size===Object.keys(screen.elements).length,reachable:visited};
}
function makeReport(flow:Flow){
 const scores={hierarchy:25,grouping:25,density:25,responsiveness:25};
 const findings:LayoutQualityFinding[]=[];
 const check=(dimension:Dimension,code:string,condition:unknown,nodeIds:string[],message:string,suggestion:string)=>{
  if(condition===true)return;
  scores[dimension]=Math.max(0,scores[dimension]-5);
  findings.push({dimension,code,nodeIds,deduction:5,message,suggestion});
 };
 const result=():LayoutQualityReport=>({
  schemaVersion:1,flow,score:dimensions.reduce((sum,key)=>sum+scores[key],0),maxScore:100,
  scores,findings,basis:"static-declarative",runtimeEvidence:"not-executed",policy:"advisory-only",
  limitations:[
   "Heurística determinística sobre a árvore JSON e os contratos semânticos; não mede pixels, contraste ou percepção humana.",
   "Responsividade estimada a partir de propriedades declaradas; comportamento em breakpoints e acessibilidade exigem navegador.",
   "A pontuação não admite contratos Pi, não altera Zod, não libera ações e não interfere na aprovação ou no auto-merge."
  ]
 });
 return {scores,findings,check,result};
}
export function evaluateLayoutQuality(requirements:Context,generated:unknown):LayoutQualityReport|null{
 if(!knownFlows.has(requirements.flow as Flow))return null;
 const flow=requirements.flow as Flow;
 const report=makeReport(flow);
 const screen=parseScreen(generated);
 if(!screen){
  for(const dimension of dimensions){
   report.scores[dimension]=0;
   report.findings.push({dimension,code:"invalid-tree",nodeIds:[],deduction:25,
    message:"Árvore de layout ausente ou malformada.",
    suggestion:"Corrigir raiz, elementos, propriedades e referências antes de avaliar o layout."});
  }
  return report.result();
 }
 const nodes=screen.elements,root=nodes[screen.root],graph=graphSummary(screen);
 const get=(id:string)=>nodes[id];
 const noOverrides=Object.values(nodes).every(n=>!["className","style","width","minWidth"].some(k=>Object.hasOwn(n.props,k)));
 const allVertical=Object.values(nodes).every(n=>n.type!=="Stack"||n.props.direction==="vertical");
 const allGrids=Object.values(nodes).filter(n=>n.type==="Grid");
 const gridColumnsValid=allGrids.every(n=>Number.isInteger(Number(n.props.columns))&&Number(n.props.columns)>=1&&Number(n.props.columns)<=4);
 const properlyLinked=graph.sound&&Object.values(nodes).every(n=>new Set(n.children).size===n.children.length);

 if(flow==="registration"){
  const fields=requirements.fields??[];
  let plan:ReturnType<typeof planRegistrationLayout>;
  try{plan=planRegistrationLayout(fields,requirements.answers.layout);}catch{return evaluateLayoutQuality({flow,answers:{...requirements.answers,layout:"single"},fields},null);}
  const ids=plan.groups.map(x=>"group_"+x.id);
  const region=get("form_fields");
  const groups=plan.groups.map(g=>({
   g,wrapper:get("group_"+g.id),heading:get("heading_"+g.id),controls:get("group_"+g.id+"_fields")
  }));
  const fieldIds=groups.flatMap(({controls})=>controls?.children??[]);
  const expectedIds=fields.map((_,i)=>"field_"+i);
  const layoutOrder=same(region?.children,ids);
  const groupOrder=groups.every(({g,wrapper})=>same(wrapper?.children,["heading_"+g.id,"group_"+g.id+"_fields"]));
  const correctFields=groups.every(({g,controls})=>same(controls?.children,g.fieldIndexes.map(i=>"field_"+i)));
  const headings=groups.every(({g,heading})=>heading?.type==="Heading"&&heading.props.text===g.label&&heading.props.level==="h3");
  const columns=groups.every(({g,controls})=>controls?.type===(g.columns===2?"Grid":"Stack")&&
   (g.columns===2?controls.props.columns===2:vertical(controls)));
  const meaningful=fields.length>0&&groups.every(({g})=>g.fieldIndexes.length>0);
  report.check("hierarchy","registration-root",root.type==="Card", [screen.root],"O cadastro não começa em um cartão.","Usar Card como contêiner principal.");
  report.check("hierarchy","registration-title",typeof root.props.title==="string"&&!!root.props.title.trim(),[screen.root],"Título principal ausente.","Declarar um título informativo no Card.");
  report.check("hierarchy","registration-first",root.children[0]==="form_fields",["root"],"Campos não aparecem antes das demais ações.","Posicionar form_fields primeiro.");
  report.check("hierarchy","registration-headings",headings&&groupOrder,ids,"Hierarquia de títulos e controles inconsistente.","Colocar Heading h3 antes dos controles em cada grupo.");
  report.check("hierarchy","registration-last",same(root.children,["form_fields",requirements.answers.confirmation===true?"confirmation":"preview_note"]),[screen.root],"Aviso ou confirmação fora da posição final.","Manter confirmação ou aviso após todos os campos.");
  report.check("grouping","registration-container",vertical(region),["form_fields"],"Grupos sem contêiner vertical.","Usar Stack vertical para agrupar seções.");
  report.check("grouping","registration-order",layoutOrder,ids,"Grupos fora da ordem semântica.","Reorganizar identificação, contato, acesso e extras.");
  report.check("grouping","registration-sections",groups.every(({wrapper})=>vertical(wrapper)),ids,"Seções sem agrupamento vertical.","Usar Stack por seção.");
  report.check("grouping","registration-fields",correctFields,fieldIds,"Campo inserido no grupo errado.","Distribuir os campos de acordo com o perfil de cadastro.");
  report.check("grouping","registration-references",properlyLinked&&same([...fieldIds].sort(),[...expectedIds].sort()),fieldIds,"Campos perdidos, duplicados ou órfãos.","Restaurar as referências de todos os campos uma única vez.");
  report.check("density","registration-columns",columns,groups.map(({g})=>"group_"+g.id+"_fields"),"Colunas divergentes da densidade solicitada.","Usar uma ou duas colunas conforme quantidade de campos e escolha explícita.");
  report.check("density","registration-limits",gridColumnsValid&&allGrids.every(x=>x.props.columns===2),["form_fields"],"Grid de cadastro excede duas colunas.","Limitar grupos de cadastro a duas colunas.");
  report.check("density","registration-nonempty",meaningful,ids,"Seções vazias ou formulário sem campos.","Não gerar grupo vazio; incluir somente campos solicitados.");
  report.check("density","registration-spacing",region?.props.gap==="lg"&&groups.every(({wrapper,controls})=>wrapper?.props.gap==="sm"&&controls?.props.gap==="md"),ids,"Espaçamento sem diferenciação entre seções e campos.","Usar lg entre seções, sm após títulos e md entre controles.");
  report.check("density","registration-width",root.props.maxWidth==="md",["root"],"Largura excessiva ou estreita para o formulário.","Manter maxWidth md no cartão de cadastro.");
  report.check("responsiveness","registration-centered",root.props.centered===true&&root.props.maxWidth==="md",["root"],"Cartão sem limite e centralização.","Centralizar Card e limitar a largura a md.");
  report.check("responsiveness","registration-grid",columns&&gridColumnsValid,ids,"Grid sem configuração compatível com adaptação móvel.","Utilizar Grid de até duas colunas, com fallback CSS móvel já existente.");
  report.check("responsiveness","registration-dom",correctFields&&groupOrder&&layoutOrder,ids,"Ordem de leitura da árvore divergente.","Preservar a leitura por DOM ao agrupar campos e títulos.");
  report.check("responsiveness","registration-stacks",allVertical,["form_fields"],"Stack horizontal pode comprometer telas compactas.","Preferir Stack vertical; deixar o Grid responsivo cuidar das colunas.");
  report.check("responsiveness","registration-overrides",noOverrides,[screen.root],"Layout usa sobrescritas de largura ou estilos não revisados.","Remover className/style/width extras dos nós Pi.");
 }else{
  const patternSpec=requirements as PatternRequirements;
  const plan=planPatternLayout(patternSpec);
  if(!plan)return null;
  const isLogin=flow==="login",isSearch=flow==="search";
  const isGraphs=flow==="dashboard"&&plan.variant==="graphs";
  const isKpi=flow==="dashboard"&&!isGraphs;
  const expectedChildren=plan.regions;
  const regionId=isLogin?"fields":isSearch?(requirements.answers.dateFilter===true?"filters":"root"):isGraphs?"graph_grid":"stats";
  const region=get(regionId);
  const grid=isGraphs?get("graph_grid"):isKpi?get("stats"):undefined;
  const targetCols=plan.gridColumns;
  const expectedContent=isLogin?
   ["identifier","password",...(requirements.answers.remember===true?["remember"]:[])]:
   isSearch?requirements.answers.dateFilter===true?["dates","required-date"]:["header","table"]:
   isGraphs?["graph_bar","graph_line"]:
   targetCols===2?["m1-card","m2-card"]:["m1-card","m2-card","m3-card","m4-card"];
  const hasMainTitle=isLogin?typeof root.props.title==="string"&&!!root.props.title.trim():
   isSearch?get("header")?.type==="Heading":
   isGraphs?typeof root.props.title==="string"&&!!root.props.title.trim():
   get("overview-title")?.type==="Heading";
  const mainOrder=same(root.children,expectedChildren);
  const contentOrder=same(region?.children,expectedContent);
  const mainControls=isLogin?get("action")?.type==="Button"&&get("identifier")?.type==="Input"&&get("password")?.type==="Input":
   isSearch?get("table")?.type==="DataTable":
   isGraphs?get("graph_bar")?.type==="BarGraph"&&get("graph_line")?.type==="LineGraph":
   expectedContent.every(id=>get(id)?.type==="Card");
  const contentCount=expectedContent.length>0&&contentOrder;
  const expectedSpacing=isLogin?region?.props.gap==="md":isSearch?
   root.props.gap==="lg"&&(requirements.answers.dateFilter!==true||region?.props.gap==="md"):
   isGraphs?grid?.props.gap==="md":root.props.gap==="lg"&&grid?.props.gap==="md";
  const mainStructure=isLogin?root.type==="Card"&&screen.root==="root":
   isSearch?vertical(root):isGraphs?root.type==="Card":vertical(root);
  const closing=expectedChildren.at(-1)===(isLogin?"notice":isSearch?"table":
   requirements.answers.showFootnote===true?"footnote":isGraphs?"graph_grid":"stats");
  report.check("hierarchy","pattern-root",mainStructure&&screen.root===plan.root,[screen.root],"Contêiner principal incoerente com a tela.","Restaurar a raiz e seu tipo definidos no perfil semântico.");
  report.check("hierarchy","pattern-title",hasMainTitle,[screen.root],"Cabeçalho principal ausente.","Exibir título antes do conteúdo principal.");
  report.check("hierarchy","pattern-order",mainOrder,[screen.root],"Ordem das regiões contraria o fluxo de leitura.","Reordenar regiões conforme o plano semântico.");
  report.check("hierarchy","pattern-content",mainControls,[regionId],"Conteúdo principal incompleto ou trocado.","Restaurar os controles ou indicadores esperados.");
  report.check("hierarchy","pattern-closing",closing,[screen.root],"Aviso, tabela ou nota fora da posição final.","Colocar a região de encerramento após o conteúdo apropriado.");
  report.check("grouping","pattern-region",isLogin?vertical(region):
   isSearch?requirements.answers.dateFilter===true?vertical(region):vertical(root):
   grid?.type==="Grid",[regionId],"Agrupamento principal não expressa a relação entre elementos.","Usar Stack vertical para campos/filtros ou Grid para indicadores.");
  report.check("grouping","pattern-membership",contentOrder,[regionId],"Conteúdo misturado ou em grupo incorreto.","Preservar os elementos no grupo semântico esperado.");
  report.check("grouping","pattern-labels",isLogin?hasLabel(get("identifier"))&&hasLabel(get("password")):
   isSearch?get("table")?.props.caption!==undefined:
   isGraphs?["graph_bar","graph_line"].every(id=>!!get(id)?.props.title):
   expectedContent.every(id=>get(id)?.children.length===1),[regionId],"Itens sem identificação ou estrutura contextual.","Rotular entradas, resultados e indicadores.");
  report.check("grouping","pattern-references",properlyLinked,[screen.root],"Nós desconectados, referenciados duas vezes ou cíclicos.","Manter árvore sem órfãos, ciclos ou filhos duplicados.");
  report.check("grouping","pattern-spacing",expectedSpacing,[regionId],"Espaçamento não distingue conteúdo relacionado.","Restaurar os gaps do plano semântico.");
  report.check("density","pattern-columns",grid?grid.props.columns===targetCols:allGrids.length===0,[regionId],"Número de colunas diverge da opção declarada.","Adequar a grade à densidade escolhida.");
  report.check("density","pattern-limits",gridColumnsValid&&(isGraphs?allGrids.every(g=>g.props.columns===2):true),[regionId],"Densidade excede o limite semântico.","Limitar gráficos a duas colunas e KPIs a até quatro.");
  report.check("density","pattern-content-count",contentCount,[regionId],"Quantidade de itens não condiz com o grupo previsto.","Restaurar itens esperados sem inserir elementos redundantes.");
  report.check("density","pattern-regions",root.children.length<=4&&root.children.length>=1,[screen.root],"Número excessivo ou insuficiente de regiões.","Manter somente regiões necessárias à tarefa.");
  report.check("density","pattern-balance",isLogin?root.props.maxWidth==="md":
   isSearch?get("table")?.type==="DataTable":
   isGraphs?grid?.children.length===2:
   grid?.children.length===targetCols,[regionId],"Conteúdo e capacidade do contêiner estão desequilibrados.","Ajustar densidade ao conteúdo e ao contêiner disponível.");
  report.check("responsiveness","pattern-container",isLogin?root.props.maxWidth==="md"&&root.props.centered===true:
   isSearch?vertical(root):
   isGraphs?root.props.maxWidth==="full"&&root.props.centered===false:
   vertical(root),[screen.root],"Contêiner não segue as restrições de largura e orientação.","Restaurar largura e orientação do perfil.");
  report.check("responsiveness","pattern-grid",gridColumnsValid&&(grid?grid.props.columns===targetCols:true),[regionId],"Grid não possui configuração segura para telas menores.","Respeitar o limite de colunas coberto pelas regras CSS atuais.");
  report.check("responsiveness","pattern-stacks",allVertical,[screen.root],"Stack horizontal pode prejudicar a leitura em viewport estreito.","Usar fluxo vertical para os contêineres declarativos.");
  report.check("responsiveness","pattern-reading-order",mainOrder&&contentOrder,[screen.root],"Leitura por DOM diverge da sequência semântica.","Conservar a ordem de regiões e filhos na árvore JSON.");
  report.check("responsiveness","pattern-overrides",noOverrides,[screen.root],"Propriedades visuais livres não verificadas.","Evitar largura e classes arbitrárias nos contratos Pi.");
 }
 return report.result();
}
