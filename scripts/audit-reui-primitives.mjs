#!/usr/bin/env node
/**
 * Static ReUI coverage audit: all local TSX patterns, example guidance,
 * semantic admission decisions and authoritative Zod contract definitions.
 * Source inspection is not equivalent to browser/visual/a11y certification.
 */
import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { catalogSegments } from "./lib/contract-lock.mjs";

const read = p => JSON.parse(readFileSync(p,"utf8"));
const families = read("src/ui-catalog/reui-guidance.json");
const guides = read("src/ui-catalog/reui-example-guidance.pt-BR.json");
const decisions = read("src/ui-catalog/reui-semantic-admissions.json").entries;
const approval = read("src/ui-catalog/contracts.lock.json").components;
const sourceBaseline = read("src/ui-catalog/reui-primitive-source-baseline.json");
const baselineEntries = new Map(sourceBaseline.entries.map(x => [x.exampleId,x]));
if(sourceBaseline.entries.length !== 559 || baselineEntries.size !== 559)throw new Error("Manifesto de fontes incompleto.");
const prior = new Map(decisions.map(e=>[e.exampleId,e]));
const contracts = new Map(approval.map(e=>[e.name,e]));
const schemas = new Map(catalogSegments().map(c=>[c.name,c.segment]));
const sha = s=>createHash("sha256").update(s).digest("hex");
const gitBlobSha = s=>createHash("sha1").update("blob "+Buffer.byteLength(s,"utf8")+"\0").update(s,"utf8").digest("hex");
const fileFor = (family,n)=>"src/ui-catalog/extensions/composites/reui-"+
  family.replace(/([a-z0-9])([A-Z])/g,"$1-$2").toLowerCase()+"-"+n+".tsx";
const features = {
  state:/\b(?:useState|useReducer)\s*\(/,
  events:/\bon(?:Click|Change|Select|ValueChange|CheckedChange|OpenChange|KeyDown|RatingChange|Submit)\s*=/,
  remoteMedia:/https:\/\/(?:images\.unsplash\.com|picsum\.photos|placehold\.co|dummyimage\.com)|\bsrc\s*=\s*["']https?:\/\//,
  image:/<(?:img|Image|AvatarImage)\b|\bbackgroundImage\b/,
  timed:/\b(?:Autoplay|autoPlay|autoplay|setInterval|setTimeout)\b/,
  submenu:/\b(?:DropdownMenuSub|SubMenu|submenu|MenuSub)\b/,
  tooltipOrPopover:/\b(?:Tooltip|Popover)\b/,
  form:/<(?:Input|Textarea|RadioGroup|Select|Checkbox|Switch|NativeSelect)\b/,
  disabled:/\bdisabled(?:=|\s|\/|>|$)/,
  aria:/aria-label|aria-labelledby|htmlFor|sr-only/,
  responsive:/\b(?:sm|md|lg|xl):[a-z]/,
  counter:/MAX_CHARS|maxLength=|remaining\s*=|charactersRemaining/
};
function assess(family,best,previous,signals,imports){
  if(previous.classification==="approved-semantic")return ["separate-semantic-contract",previous.reason];
  if(previous.classification==="deferred-semantic")return ["not-admitted-security-or-integration",previous.reason];
  if(previous.classification==="existing-contract-gap")return ["contract-capability-gap",previous.reason];
  if(previous.classification==="existing-composition")return ["approved-composition-candidate",previous.reason];
  if(family==="Carousel"&&(signals.image||signals.timed||/foto|imagem|miniatura|auto|legenda|ponto|slide/i.test(best)))
    return ["contract-capability-gap","Carousel Pi suporta cartão textual e orientação; mídias, miniaturas, autoplay, dots e layouts especiais não são representados."];
  if(family==="Rating"&&/meia estrela|meio|3,5|4,5|fra[cç][aã]o/i.test(best))
    return ["contract-capability-gap","Rating Pi aceita número, mas o renderizador pinta somente estrelas inteiras."];
  if(family==="DropdownMenu"&&(signals.submenu||signals.state||imports.length>1))
    return ["contract-capability-gap","DropdownMenu Pi modela menu plano, sem submenu, seleções ou conteúdo estruturado."];
  if(family==="Pagination"&&/por p[aá]gina|ir para|campo|primeir|[úu]ltim|intervalo/i.test(best))
    return ["contract-capability-gap","Pagination Pi não fornece goto, tamanho de página ou first/last configuráveis."];
  if(family==="RadioGroup"&&(imports.length>1||signals.image))
    return ["approved-composition-candidate","Radio Pi recebe itens de texto; cartões com avatares, valores e auxiliares exigem composição tipada."];
  if(family==="ButtonGroup"&&(imports.length>1||signals.state||signals.events))
    return ["approved-composition-candidate","ButtonGroup Pi suporta botões simples, não menus, campos ou estado complexo."];
  if(family==="Textarea"&&signals.counter)
    return ["separate-semantic-contract","CharacterCountTextarea é o contrato aprovado para limite e contador."];
  if(family==="Spinner"&&imports.length>1)
    return ["approved-composition-candidate","Spinner em overlays e cartões exige composição e modelo de estado."];
  if(family==="Table"&&/orden|filtro|pesquis|paginação|sele[çc][aã]o/i.test(best))
    return ["approved-composition-candidate","Tabela avançada deve usar DataTable ou composição validada."];
  if(signals.remoteMedia)
    return ["not-admitted-security-or-integration","O exemplo referencia mídia remota; o Pi não deve aceitar URLs de origem livre."];
  if(imports.length>=2)
    return ["approved-composition-candidate","O exemplo combina múltiplas primitivas, não sendo representável por um único tipo básico."];
  if(signals.state&&signals.events&&!["Checkbox","Switch","Toggle","ToggleGroup","Rating","Slider","Accordion","Collapsible","RadioGroup"].includes(family))
    return ["needs-behavior-review","O exemplo contém estado e eventos cuja semântica deve ser verificada contra eventos autorizados."];
  return ["core-contract-candidate","Semântica básica relacionada à primitiva; paridade exata de estilos, propriedades e estados não certificada."];
}
// Only literal, known JSX presentation props are counted. This is an
// inventory of candidate capabilities, not an authorization to expose them.
// Each property is counted at most once per example, not once per occurrence.
const presentationProps = new Set(("variant size disabled orientation value defaultValue checked defaultChecked " +
  "type placeholder required readOnly open defaultOpen multiple collapsible side align " +
  "inset icon loading className label description title maxLength rows step min max " +
  "loop opts draggable autoPlay autoplay showArrows showIndicators dir color " +
  "name src alt href render asChild shortcut").split(" "));
function exampleProps(family,code) {
  const tags = family==="RadioGroup" ? new Set(["RadioGroup","RadioGroupItem"]) :
    family==="Rating" ? new Set(["Rating","RatingItem"]) : new Set([family]);
  const props=new Set();
  // Heuristic: JSX opening tags, bounded to the named family. Custom nested
  // components remain visible in implementationSignals.primitives instead.
  for(const match of code.matchAll(/<([A-Z][A-Za-z0-9]*)\b([^>]*?)>/g)){
    if(!tags.has(match[1]))continue;
    for(const attr of match[2].matchAll(/(?:^|\s)([A-Za-z][A-Za-z0-9]*)\s*(?==|(?=\s|\/|$))/g)){
      if(presentationProps.has(attr[1]))props.add(attr[1]);
    }
  }
  return [...props].sort();
}
const examples=[],summary=[];
for(const [family,info] of Object.entries(families)){
  const related=family==="RadioGroup"?"Radio":family;
  const segment=schemas.get(related)??"";
  const contractProps=[...new Set([...segment.matchAll(/\b([A-Za-z][A-Za-z0-9]*)\s*:\s*z\./g)].map(x=>x[1]))].sort();
  const group=[];
  for(let i=0;i<info.examples.length;i++){
    const [title,id]=info.examples[i],guide=guides[id],decision=prior.get(id),path=fileFor(family,i+1);
    if(!guide||!decision||!existsSync(path))throw new Error("Exemplo ausente: "+id+" ("+path+")");
    const code=readFileSync(path,"utf8");
    const baseline=baselineEntries.get(id);
    if(!baseline || baseline.sourcePath !== path || baseline.family !== family || baseline.title !== title || baseline.sourceBlobSha !== gitBlobSha(code))
      throw new Error(id+": código-fonte alterado ou sem registro no snapshot; reaudite antes de atualizar o baseline.");
    const imports=[...new Set([...code.matchAll(/from\s+["']@\/components\/ui\/([a-z0-9-]+)["']/g)].map(x=>x[1]))].sort();
    const signals=Object.fromEntries(Object.entries(features).map(([k,r])=>[k,r.test(code)]));
    const [coverage,reason]=assess(family,guide.bestFor,decision,signals,imports);
    const name=decision.contractName??related;
    if(!contracts.has(name))throw new Error("Contrato associado não aprovado: "+id+" => "+name);
    if(baseline.relatedContract!==name || baseline.semanticDecision!==decision.classification || baseline.guideUrl!==guide.sourceUrl || baseline.caseDescription!==guide.bestFor)
      throw new Error(id+": metadados/contrato divergentes do snapshot.");
    const item={
      exampleId:id,family,title,sourcePath:path,sourceSha256:sha(code),sourceLines:code.split("\n").length,
      sourceUrl:guide.sourceUrl,caseDescription:guide.bestFor,
      approvedContract:name,coverage,reason,
      implementationSignals:{primitives:imports,observedPresentationProps:exampleProps(family,code),...signals},
      priorSemanticDecision:decision.classification,
      visualParity:"not-tested",keyboardParity:"not-tested",
    };
    examples.push(item);group.push(item);
  }
  const counts={};for(const e of group)counts[e.coverage]=(counts[e.coverage]??0)+1;
  const propCounts=new Map();
  for(const entry of group)for(const prop of entry.implementationSignals.observedPresentationProps){
    propCounts.set(prop,(propCounts.get(prop)??0)+1);
  }
  const observedProps=[...propCounts].map(([property,examples])=>({
    property,examples,coveragePercent:Math.round(examples*100/group.length),
    inApprovedContract:contractProps.includes(property)
  })).sort((a,b)=>b.examples-a.examples||a.property.localeCompare(b.property));
  summary.push({family,examples:group.length,contract:related,version:contracts.get(related)?.version??null,
    contractProps,observedProps,sharedProps:observedProps.filter(p=>p.examples>=2),
    coverage:counts,signals:{
      state:group.filter(x=>x.implementationSignals.state).length,
      multiplePrimitives:group.filter(x=>x.implementationSignals.primitives.length>1).length,
      remoteMedia:group.filter(x=>x.implementationSignals.remoteMedia).length,
      timed:group.filter(x=>x.implementationSignals.timed).length,
    }});
}
if(examples.length!==559||summary.length!==31||new Set(examples.map(e=>e.exampleId)).size!==559)
  throw new Error("Cobertura incompleta: esperado 559 exemplos em 31 famílias");
const totals={};for(const item of examples)totals[item.coverage]=(totals[item.coverage]??0)+1;
const report={schemaVersion:1,scope:"559 TSX ReUI presentes neste checkout; upstream pode ter outros exemplos",
  method:"Leitura de TODOS os TSX, orientação individual, inventário Zod e decisão semântica já versionada.",
  limitation:"Classificação ESTÁTICA. Não comprova aparência, interatividade, teclado ou fidelidade pixel a pixel.",
  count:examples.length,familiesCount:summary.length,coverage:totals,families:summary,examples};
const filepath="src/ui-catalog/reui-primitive-coverage-audit.json",data=JSON.stringify(report,null,2)+"\n";
if(process.argv.includes("--write"))writeFileSync(filepath,data);
if(process.argv.includes("--check")&&existsSync(filepath)&&readFileSync(filepath,"utf8")!==data)
  throw new Error(filepath+" desatualizado. Execute npm run reui:audit -- --write");
console.log("ReUI source audit: "+examples.length+" examples / "+summary.length+" families; "+JSON.stringify(totals));
