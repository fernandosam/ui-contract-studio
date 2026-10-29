import { useEffect, useMemo, useState } from 'react';
import { z } from 'zod';
import { componentDefinitions, catalog } from '@/ui-catalog/catalog';
import contractLock from '@/ui-catalog/contracts.lock.json';
import reuiGuidance from '@/ui-catalog/reui-guidance.json';
import reuiExampleGuidancePtBr from '@/ui-catalog/reui-example-guidance.pt-BR.json';
import shadcnGuidance from '@/ui-catalog/shadcn-guidance.json';
import primitiveGuidancePtBr from '@/ui-catalog/primitive-guidance.pt-BR.json';
import compositionPolicy from '@/ui-catalog/composition-policy.json';
import { PrimitiveSourceViewer } from '@/ui-catalog/extensions/composites/primitive-source-viewer';
import { SpecScreen } from './spec-screen';
import piManifest from '../../pi-catalog/contracts.json';
import semanticGuidance from '@/ui-catalog/semantic-contract-guidance.json';
import {discoverContracts,functionalGroups,type DiscoveryEntry} from './catalog-discovery';
import { AdmissionExplorer } from './admission-explorer';
import {CompositionRecommendationPanel, pilotFamilies} from './composition-recommendations';

// Ferramenta administrativa fixa; telas geradas e composições permanecem 100% declarativas.
type UiNode = { type: string; props: Record<string, unknown>; children: string[]; slots?: Record<string,string[]> };
type UiSpec = { root: string; elements: Record<string,UiNode>; state?: Record<string,unknown> };
type PatternInfo = { id: string; title: string; category: string; description: string };
type FieldKind = 'text' | 'number' | 'boolean' | 'enum' | 'json';
type FieldInfo = { name: string; kind: FieldKind; required: boolean; nullable: boolean; options: string[] };

const examples = import.meta.glob('../../pi-catalog/examples/*.json', { eager: true, import: 'default' }) as Record<string, UiSpec>;
const screenFiles = import.meta.glob('../ui-screens/*.json', { eager: true, import: 'default' }) as Record<string, UiSpec>;
const screenMeta = import.meta.glob('../ui-screen-meta/*.json', { eager: true, import: 'default' }) as Record<string, { title:string;section:string;order:number }>;
const patternFiles = import.meta.glob('../ui-patterns/*.json', { eager: true, import: 'default' }) as Record<string, UiSpec>;
const patternMeta = import.meta.glob('../ui-patterns/*.meta.json', { eager: true, import: 'default' }) as Record<string, PatternInfo>;

function extractBranch(spec: UiSpec, root: string): UiSpec {
  const elements: Record<string,UiNode> = {};
  const visit = (id: string) => {
    if (elements[id] || !spec.elements[id]) return;
    const node = spec.elements[id];
    elements[id] = node;
    for (const child of node.children ?? []) visit(child);
    for (const slot of Object.values(node.slots ?? {})) for (const child of slot) visit(child);
  };
  visit(root);
  return { root, elements, ...(spec.state ? {state:spec.state} : {}) };
}

const types = Object.keys(componentDefinitions).sort((a,b)=>a.localeCompare(b));
// Field is a shadcn primitive; DataTable/DatePicker/BlockSidebar compose several primitives.
const primitiveTypes = new Set(contractLock.components.filter(c=>c.tier==='base').map(c=>c.name).concat(compositionPolicy.primitiveExtensions));
const primitiveList=types.filter(name=>primitiveTypes.has(name));
const compositeList=types.filter(name=>!primitiveTypes.has(name));
const screenOptions=Object.entries(screenFiles).map(([path,spec])=>{
 const filename=path.split('/').at(-1)??'';
 const meta=screenMeta[`../ui-screen-meta/${filename}`];
 return {id:filename.replace('.json',''),title:meta?.title??filename,path,spec,order:meta?.order??999};
}).sort((a,b)=>a.order-b.order||a.title.localeCompare(b.title));
const versions = new Map(contractLock.components.map(item=>[item.name,item]));
const samples: Record<string, {source:string;spec:UiSpec;id:string}> = {};
// O Explorador e o Pi usam a mesma fonte de exemplos aprovados.
for (const [path,spec] of Object.entries(examples)) {
  const root=spec.elements[spec.root];
  if(root?.type) samples[root.type] = {source:path.split('/').at(-1) ?? '',spec,id:spec.root};
}

function getSchema(type:string): z.ZodObject<z.ZodRawShape> | undefined {
  const definition = componentDefinitions[type as keyof typeof componentDefinitions];
  if (!definition || !('props' in definition)) return undefined;
  return definition.props as z.ZodObject<z.ZodRawShape>;
}
function fieldInfo(name:string, original:z.core.$ZodType):FieldInfo {
  let schema: z.core.$ZodType = original;
  let required = true, nullable = false;
  while (schema instanceof z.ZodOptional || schema instanceof z.ZodNullable || schema instanceof z.ZodDefault) {
    if (schema instanceof z.ZodOptional || schema instanceof z.ZodDefault) required = false;
    if (schema instanceof z.ZodNullable) nullable = true;
    schema = schema.unwrap();
  }
  if (schema instanceof z.ZodEnum) return {name,kind:'enum',required,nullable,options:schema.options.map(String)};
  if (schema instanceof z.ZodBoolean) return {name,kind:'boolean',required,nullable,options:[]};
  if (schema instanceof z.ZodNumber) return {name,kind:'number',required,nullable,options:[]};
  if (schema instanceof z.ZodString) return {name,kind:'text',required,nullable,options:[]};
  return {name,kind:'json',required,nullable,options:[]};
}
function getFields(type:string):FieldInfo[] {
  const shape = getSchema(type)?.shape;
  return shape ? Object.entries(shape).map(([name,field])=>fieldInfo(name,field)) : [];
}
function showValue(value:unknown,kind:FieldKind):string {
  if (value===undefined || value===null) return '';
  return kind==='json' ? JSON.stringify(value,null,2) : String(value);
}
function decodeValue(field:FieldInfo,raw:string):unknown {
  if (raw==='' && !field.required) return undefined;
  if (raw==='' && field.nullable) return null;
  if (field.kind==='number') {
    if(raw.trim()==='') throw new Error('Informe um número válido.');
    const number=Number(raw);
    if(!Number.isFinite(number)) throw new Error('Informe um número finito.');
    return number;
  }
  if (field.kind==='boolean') return raw==='true';
  if (field.kind==='json') {
    if(!raw.trim()) throw new Error('Informe um JSON válido para esta propriedade.');
    return JSON.parse(raw) as unknown;
  }
  return raw;
}

function LivePropsEditor({type,original,source,targetId}:{type:string;original:UiSpec;source:string;targetId?:string}) {
  const selectedId=targetId??original.root;
  const root = original.elements[selectedId];
  const schema = getSchema(type);
  const fields = getFields(type);
  const [approved,setApproved] = useState<Record<string,unknown>>({...root.props});
  const [drafts,setDrafts] = useState<Record<string,string>>({});
  const [errors,setErrors] = useState<Record<string,string>>({});
  const [revision,setRevision] = useState(0);
  const effective = { ...original, elements:{...original.elements,[selectedId]:{...root,props:approved}} };
  const validated = catalog.validate(effective);

  const update = (field:FieldInfo, raw:string) => {
    setDrafts(prev=>({...prev,[field.name]:raw}));
    try {
      const value = decodeValue(field,raw);
      const next = {...approved};
      if(value===undefined) delete next[field.name]; else next[field.name] = value;
      const parsed = schema?.safeParse(next);
      if(!parsed?.success) {
        const issues = parsed?.error.issues.map(i=>`${i.path.join('.')||'props'}: ${i.message}`).join('; ') || 'Propriedade inválida';
        setErrors(prev=>({...prev,[field.name]:issues}));
        return;
      }
      const candidate = {...original,elements:{...original.elements,[selectedId]:{...root,props:parsed.data}}};
      const result = catalog.validate(candidate);
      if(!result.success) {
        setErrors(prev=>({...prev,[field.name]:'Valor rejeitado pelo contrato da interface.'}));
        return;
      }
      setApproved(parsed.data);
      setErrors(prev=>{const nextErrors={...prev};delete nextErrors[field.name];return nextErrors;});
      setRevision(n=>n+1);
    } catch(err) {
      setErrors(prev=>({...prev,[field.name]:err instanceof Error?err.message:'Valor inválido'}));
    }
  };
  const reset = () => {
    setApproved({...root.props});setDrafts({});setErrors({});setRevision(n=>n+1);
  };
  return <div className="min-w-0 space-y-4">
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-semibold">Propriedades editáveis</h3>
        <button type="button" className="rounded-md border border-input px-3 py-1.5 text-xs hover:bg-muted" onClick={reset}>Restaurar valores</button>
      </div>
      <p className="mb-4 mt-2 text-xs text-muted-foreground">Alterações locais e temporárias, validadas pelo Zod antes de renderizar. Não modificam arquivos nem contratos. Fonte: {source}.</p>
      {fields.length===0 ? <p className="text-sm text-muted-foreground">Este contrato não expõe propriedades editáveis.</p> :
        <div className="grid min-w-0 gap-3 sm:grid-cols-2">
          {fields.map(field=>{
            const id=`property-${type}-${field.name}`;
            const raw=drafts[field.name]??showValue(approved[field.name],field.kind);
            return <div className={`min-w-0 space-y-1 ${field.kind==='json'?'sm:col-span-2':''}`} key={field.name}>
              <label htmlFor={id} className="block text-xs font-medium">{field.name} <span className="text-muted-foreground">· {field.kind}{field.required?' · obrigatório':''}</span></label>
              {field.kind==='boolean' ?
                <select id={id} value={raw} onChange={e=>update(field,e.target.value)} className="w-full rounded-md border border-input bg-background p-2 text-sm" aria-invalid={Boolean(errors[field.name])}>
                  {!field.required&&<option value="">Não definido</option>}<option value="true">true</option><option value="false">false</option>
                </select> : field.kind==='enum' ?
                <select id={id} value={raw} onChange={e=>update(field,e.target.value)} className="w-full rounded-md border border-input bg-background p-2 text-sm" aria-invalid={Boolean(errors[field.name])}>
                  {!field.required&&<option value="">Não definido</option>}{field.options.map(o=><option key={o} value={o}>{o}</option>)}
                </select> : field.kind==='json' ?
                <textarea id={id} rows={Math.min(9,Math.max(3,raw.split('\n').length))} value={raw} onChange={e=>update(field,e.target.value)} className="w-full rounded-md border border-input bg-background p-2 font-mono text-xs" spellCheck={false} aria-invalid={Boolean(errors[field.name])} placeholder="[] ou {}"/> :
                <input id={id} type={field.kind==='number'?'number':'text'} value={raw} onChange={e=>update(field,e.target.value)} className="w-full rounded-md border border-input bg-background p-2 text-sm" aria-invalid={Boolean(errors[field.name])} placeholder={!field.required?'Não definido':undefined}/>
              }
              {errors[field.name]&&<p className="text-xs text-destructive" role="alert">{errors[field.name]}</p>}
            </div>;
          })}
        </div>}
    </div>
    <div className="min-w-0 rounded-lg border border-border bg-card p-4">
      <h4 className="mb-3 font-semibold">Prévia em tempo de execução</h4>
      <div className={`min-w-0 max-w-full overflow-x-auto ${type==='Separator'?'flex min-h-10 items-center':''}`} data-testid="catalog-live-preview">
        {validated.success ? <SpecScreen key={revision} spec={effective}/> : <p role="alert" className="text-destructive">Prévia bloqueada: contrato inválido.</p>}
      </div>
    </div>
    <details className="min-w-0 rounded-lg border border-border bg-card p-4">
      <summary className="cursor-pointer text-sm font-medium">JSON atualizado da prévia</summary>
      <pre className="mt-3 max-h-72 overflow-auto rounded bg-muted p-3 text-xs"><code>{JSON.stringify(effective,null,2)}</code></pre>
    </details>
  </div>;
}


type ReuiGuide = {whenUse:string[];whenNotUse:string[];agentNotes:string[];examples:[string,string][]};
const reuiDocs = reuiGuidance as unknown as Record<string,ReuiGuide>;
type ShadcnGuide = Pick<ReuiGuide,'whenUse'|'whenNotUse'|'agentNotes'> & {sourceUrl:string};
const shadcnDocs = shadcnGuidance as Record<string,ShadcnGuide>;
const localizedPrimitiveDocs = primitiveGuidancePtBr as unknown as Record<string,ReuiGuide>;
function ReuiGuidance({type}:{type:string}) {
 const guide=localizedPrimitiveDocs[type] ?? shadcnDocs[type];
 const officialUrl=shadcnDocs[type]?.sourceUrl;
 const slug=type.replace(/([a-z0-9])([A-Z])/g,'$1-$2').toLowerCase();
 const referenceUrl=officialUrl ?? (reuiDocs[type]?`https://reui.io/components/${slug}`:null);
 return <section lang="pt-BR" className="rounded-lg border border-border bg-card p-4 space-y-3" data-testid="primitive-guidance">
  <div className="flex flex-wrap justify-between gap-2">
   <h4 className="font-semibold">Orientações para agentes · {type}</h4>
   {referenceUrl&&<a href={referenceUrl} target="_blank" rel="noopener noreferrer" className="text-xs underline underline-offset-4">{officialUrl?'Documentação shadcn/ui':'Documentação ReUI'} ↗</a>}
  </div>
  {guide ? <div className="grid gap-4 md:grid-cols-3">
   {([['Quando usar',guide.whenUse],['Quando não usar',guide.whenNotUse],['Notas do agente',guide.agentNotes]] as const).map(([heading,lines])=>
    <div key={heading}><h5 className="mb-2 text-sm font-medium">{heading}</h5><ul className="list-disc space-y-1 pl-4 text-xs leading-relaxed text-muted-foreground">{lines.map(line=><li key={line}>{line}</li>)}</ul></div>)}
  </div> : <p className="text-sm text-muted-foreground">Orientações específicas ainda não verificadas no ReUI para este componente. Consulte a fonte vinculada; nenhuma recomendação não confirmada será apresentada como oficial.</p>}
 </section>;
}

type SemanticOverlay = {
 component:string; purpose:string; rationale:string[];
 source:{url:string;reviewedOn:string;provider:string};
 capabilities:{id:string;description:string;state:string;testRequirements:string[]}[];
 integrations:{component:string;relationship:string;reason:string}[];
 faqDecisions:{question:string;guidance:string}[];
 derivedTestCases:{id:string;kind:string;description:string}[];
};
const semanticFiles=import.meta.glob<SemanticOverlay>('../ui-catalog/knowledge/*.json',{
 eager:true,import:'default',
});
const curatedSemanticByType=Object.fromEntries(Object.values(semanticFiles).map(doc=>[doc.component,doc]));
const capabilityLabels:Record<string,string>={
 'implemented-static-evidence':'Evidência no código',
 'documented-not-implemented':'Documentado; ainda não implementado',
 'runtime-review-required':'Requer testes em execução',
};
function SemanticKnowledgePanel({type}:{type:string}){
 const doc=curatedSemanticByType[type] as SemanticOverlay|undefined;
 if(!doc)return null;
 return <section className="min-w-0 rounded-lg border border-border bg-card p-4 space-y-3" data-testid="semantic-knowledge">
  <div className="flex flex-wrap items-center justify-between gap-2">
   <h4 className="font-semibold">Conhecimento semântico · {type}</h4>
   <a href={doc.source.url} target="_blank" rel="noopener noreferrer" className="text-xs underline underline-offset-4">Fonte: {doc.source.provider} ↗</a>
  </div>
  <p className="text-sm text-muted-foreground">{doc.purpose}</p>
  <p className="text-xs text-muted-foreground">Orientações verificáveis, não novas permissões. Evidência estática não equivale a homologação funcional ou de acessibilidade.</p>
  <details className="rounded-md border p-3" open>
   <summary className="cursor-pointer text-sm font-medium">Capacidades e lacunas ({doc.capabilities.length})</summary>
   <ul className="mt-3 grid gap-2 md:grid-cols-2">
    {doc.capabilities.map(c=><li key={c.id} className="rounded-md bg-muted/40 p-3 text-xs">
     <p className="font-medium">{c.description}</p>
     <p className="mt-1 text-muted-foreground">{capabilityLabels[c.state]??'Pendente de revisão'}</p>
    </li>)}
   </ul>
  </details>
  <details className="rounded-md border p-3">
   <summary className="cursor-pointer text-sm font-medium">Integrações sugeridas ({doc.integrations.length})</summary>
   <p className="mt-2 text-xs text-muted-foreground">Candidatas da documentação. Não são dependências verificadas nem ampliam os contratos Pi.</p>
   <ul className="mt-3 grid gap-2 sm:grid-cols-2">
    {doc.integrations.map(item=><li key={item.component} className="rounded-md bg-muted/40 p-3 text-xs">
     <strong>{item.component}</strong> <span className="text-muted-foreground">· {Object.hasOwn(componentDefinitions,item.component)?'Tipo aprovado no catálogo':'Sem tipo Pi aprovado'}</span>
     <p className="mt-1 text-muted-foreground">{item.reason}</p>
    </li>)}
   </ul>
  </details>
  <details className="rounded-md border p-3">
   <summary className="cursor-pointer text-sm font-medium">Regras de decisão e dúvidas frequentes ({doc.faqDecisions.length})</summary>
   <dl className="mt-3 space-y-2">{doc.faqDecisions.map(item=><div key={item.question} className="text-xs">
     <dt className="font-medium">{item.question}</dt><dd className="mt-1 text-muted-foreground">{item.guidance}</dd>
   </div>)}</dl>
  </details>
  <details className="rounded-md border p-3">
   <summary className="cursor-pointer text-sm font-medium">Testes recomendados ({doc.derivedTestCases.length})</summary>
   <ul className="mt-2 list-disc space-y-2 pl-5 text-xs text-muted-foreground">
    {doc.derivedTestCases.map(item=><li key={item.id}>{item.description} <span>({item.kind})</span></li>)}
   </ul>
  </details>
 </section>;
}

type Kind='primitive'|'composite';
type ContractTab='preview'|'contract'|'semantics';
const piByType=new Map(piManifest.components.map(item=>[item.type,item]));
function ContractDetails({type}:{type:string}){
 const contract=versions.get(type);
 const published=piByType.get(type);
 const fingerprint=contract?.semanticFingerprint;
 const maturity=contract?.stability??'experimental';
 const available=maturity==='stable'&&published?.lifecycle==='stable'&&published?.stability==='stable'&&published?.fingerprint===fingerprint;
 return <section aria-label={"Contrato "+type} className="rounded-xl border bg-card p-5 space-y-5" data-testid="component-contract">
  <div className="flex flex-wrap items-center justify-between gap-3">
   <div><h4 className="font-semibold">Contrato versionado</h4><p className="text-sm text-muted-foreground">Fonte de verdade: contracts.lock.json. Metadados do Pi são derivados.</p></div>
   <span className="rounded-full border bg-muted/40 px-3 py-1 text-xs font-medium">{maturity}</span>
  </div>
  <dl className="grid gap-4 sm:grid-cols-2">
   <div><dt className="text-xs text-muted-foreground">Versão</dt><dd className="mt-1 font-mono text-sm">{contract?.version??'—'}</dd></div>
   <div><dt className="text-xs text-muted-foreground">Disponibilidade no Pi</dt><dd className="mt-1 text-sm font-medium">{available?'Disponível no canal estável':'Não disponível no canal estável'}</dd></div>
   <div className="sm:col-span-2"><dt className="text-xs text-muted-foreground">Fingerprint SHA-256</dt><dd className="mt-1 break-all rounded-md bg-muted/40 p-3 font-mono text-xs">{fingerprint??'Não registrado'}</dd></div>
   <div><dt className="text-xs text-muted-foreground">Integridade</dt><dd className="mt-1 text-sm">{published?.fingerprint===fingerprint?'Projeção consistente':'Requer sincronização/verificação'}</dd></div>
   <div><dt className="text-xs text-muted-foreground">Capacidades declaradas</dt><dd className="mt-1 text-sm">{contract?.capabilities?.length?contract.capabilities.join(', '):'Sem capacidades adicionais declaradas'}</dd></div>
  </dl>
  <p className="text-xs text-muted-foreground">Disponibilidade para composição JSON não concede chamadas remotas, novas ações nem permissões de execução. A validade depende das verificações de CI.</p>
 </section>;
}

function ComponentExplorer({kind}:{kind:Kind}){
 const available=kind==='primitive'?primitiveList:compositeList;
 const initial=new URLSearchParams(window.location.search);
 const [search,setSearch]=useState(()=>initial.get('catalogSearch')??'');
 const [stability,setStability]=useState(()=>initial.get('catalogStability')??'all');
 const [group,setGroup]=useState(()=>initial.get('catalogGroup')??'all');
 const [piFilter,setPiFilter]=useState(()=>initial.get('catalogPi')??'all');
 const [tab,setTab]=useState<ContractTab>('preview');
 const [type,setType]=useState(available[0]??'Card');

 const discoveryEntries=useMemo(()=>available.map(name=>{
  const contract=versions.get(name);
  const published=piByType.get(name);
  const overlay=curatedSemanticByType[name] as SemanticOverlay|undefined;
  const guide=localizedPrimitiveDocs[name]??shadcnDocs[name]??reuiDocs[name];
  const extra=(semanticGuidance.contracts as Record<string,{whenUse?:string[]}>)[name];
  return {
   name,description:componentDefinitions[name as keyof typeof componentDefinitions]?.description,
   purpose:overlay?.purpose,
   whenUse:overlay?.whenUse??extra?.whenUse??guide?.whenUse??[],
   maturity:contract?.stability??'experimental',
   piAvailable:contract?.stability==='stable'&&contract.status==='approved'&&published?.stability==='stable'&&published.lifecycle==='stable'&&published.fingerprint===contract.semanticFingerprint&&published.version===contract.version,
  } satisfies DiscoveryEntry;
 }),[available]);
 const results=useMemo(()=>discoverContracts(discoveryEntries,{query:search,group,maturity:stability,pi:piFilter}),[discoveryEntries,search,group,stability,piFilter]);
 const filtered=results.map(item=>item.entry.name);
 const grouped=useMemo(()=>{
  const buckets=new Map<string,typeof results>();
  for(const result of results)buckets.set(result.group,[...(buckets.get(result.group)??[]),result]);
  return [...buckets.entries()];
 },[results]);
 useEffect(()=>{
  const params=new URLSearchParams(window.location.search);
  for(const [key,value] of [['catalogSearch',search],['catalogStability',stability],['catalogGroup',group],['catalogPi',piFilter]]){
   if(!value||value==='all')params.delete(key);else params.set(key,value);
  }
  window.history.replaceState(window.history.state,'',window.location.pathname+'?'+params.toString()+window.location.hash);
 },[search,stability,group,piFilter]);
 const selectedType=filtered.includes(type)?type:(filtered[0]??null);
 const sample=selectedType?samples[selectedType]:undefined;
 const spec=sample?extractBranch(sample.spec,sample.id):undefined;
 return <section className="min-w-0 space-y-5" aria-label={kind==='primitive'?'Explorador de primitivos shadcn':'Explorador de componentes compostos'}>
  <header><h2 className="text-lg font-semibold">{kind==='primitive'?'Primitivas':'Compostos'}</h2>
   <p className="text-sm text-muted-foreground">{available.length} contratos {kind==='primitive'?'de base e adaptadores oficiais':'com funcionalidades ou padrões reutilizáveis'} · edição local validada pelo Zod.</p></header>
  {kind==='primitive' && <nav aria-label="Pilotos de recomendação semântica" className="flex flex-wrap items-center gap-2">
   <span className="text-xs text-muted-foreground">Analisar composição:</span>
   {pilotFamilies.map(family=><button type="button" key={family}
    aria-current={selectedType===family?'true':undefined}
    onClick={()=>{setType(family);setSearch('');setGroup('all');setPiFilter('all');setStability('all');setTab('semantics');}}
    className={`rounded-md border px-3 py-1.5 text-xs ${type===family?'bg-secondary font-semibold':'hover:bg-muted'}`}>
    {family}
   </button>)}
  </nav>}
  <div className="grid min-w-0 gap-4 lg:grid-cols-[245px_minmax(0,1fr)]">
   <aside className="min-w-0 rounded-lg border border-border bg-card p-3 lg:max-h-[720px] lg:overflow-y-auto">
    <label htmlFor="catalog-search" className="mb-2 block text-xs font-medium">Buscar componente</label>
    <input id="catalog-search" type="search" className="mb-3 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring" placeholder="Nome, finalidade ou comportamento" value={search} onChange={e=>setSearch(e.target.value)}/>
    <label htmlFor="catalog-stability" className="mb-2 block text-xs font-medium">Estabilidade</label>
    <select id="catalog-stability" className="mb-3 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={stability} onChange={e=>setStability(e.target.value)}>
     <option value="all">Todas</option><option value="stable">Estável</option><option value="beta">Beta</option><option value="experimental">Experimental</option><option value="deprecated">Descontinuado</option>
    </select>
    <label htmlFor="catalog-group" className="mb-2 block text-xs font-medium">Finalidade</label>
    <select id="catalog-group" className="mb-3 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={group} onChange={e=>setGroup(e.target.value)}>
      <option value="all">Todas as finalidades</option>{functionalGroups.map(value=><option key={value} value={value}>{value}</option>)}
    </select>
    <label htmlFor="catalog-pi" className="mb-2 block text-xs font-medium">Disponibilidade ao Pi</label>
    <select id="catalog-pi" className="mb-3 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={piFilter} onChange={e=>setPiFilter(e.target.value)}>
      <option value="all">Todos</option><option value="available">Disponível no Pi</option><option value="unavailable">Não disponível no Pi</option>
    </select>
    <div className="mb-3 flex items-center justify-between gap-2">
      <p role="status" className="text-xs text-muted-foreground">{filtered.length} de {available.length} componentes</p>
      <button type="button" className="rounded-md px-2 py-1 text-xs underline underline-offset-2 hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring" onClick={()=>{setSearch('');setStability('all');setGroup('all');setPiFilter('all');}}>Limpar filtros</button>
    </div>
    <div className="space-y-4" aria-label="Componentes registrados">{grouped.map(([category,items])=><section key={category} aria-label={category} className="space-y-1">
      <h3 className="px-2 text-xs font-semibold text-muted-foreground">{category} <span className="font-normal">({items.length})</span></h3>
      {items.map(({entry})=><button type="button" key={entry.name} aria-current={entry.name===selectedType?'true':undefined} onClick={()=>{setType(entry.name);setTab('preview');}} className={`block w-full rounded-md px-3 py-2 text-left text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${entry.name===selectedType?'bg-secondary font-semibold':'hover:bg-muted'}`}>
       <span className="block truncate">{entry.name}</span><span className="block text-[11px] font-normal text-muted-foreground">{entry.maturity} · {entry.piAvailable?'Pi disponível':'Pi não disponível'}</span>
      </button>)}
    </section>)}</div>
    {!filtered.length&&<p className="text-sm text-muted-foreground">Nenhum componente encontrado.</p>}
   </aside>
   <div className="min-w-0 space-y-4">
    {!selectedType ? <p role="status" className="rounded-lg border bg-card p-5 text-sm text-muted-foreground">Nenhum componente corresponde aos filtros. Limpe a busca ou altere a estabilidade.</p> : <><div className="rounded-lg border border-border bg-card p-4"><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-lg font-semibold">{selectedType}</h3>
    <div className="flex flex-wrap items-center gap-2"><span className="rounded bg-secondary px-2 py-1 font-mono text-xs">v{versions.get(selectedType)?.version??'—'}</span>{kind==='primitive'&&<PrimitiveSourceViewer key={selectedType} type={selectedType} example={spec}/>}</div></div>
    <p className="mt-2 text-sm text-muted-foreground">{componentDefinitions[selectedType as keyof typeof componentDefinitions]?.description}</p>
    {discoveryEntries.find(item=>item.name===selectedType)?.whenUse?.length ? <p className="mt-2 text-sm"><span className="font-medium">Quando usar:</span> {discoveryEntries.find(item=>item.name===selectedType)?.whenUse?.[0]}</p> : null}
    <p className="mt-1 text-xs text-muted-foreground">Orientações de descoberta são consultivas; apenas schemas e contratos revisados determinam o que o Pi pode executar.</p>
    <p className="mt-3 text-xs"><strong>Propriedades:</strong> {getFields(selectedType).map(f=>f.name).join(', ')||'nenhuma'} · <strong>Exemplo:</strong> {sample?.source??'não disponível'}</p></div>
    <div role="tablist" aria-label="Detalhes do componente" className="flex flex-wrap gap-1 rounded-lg border bg-muted/25 p-1">
     {([['preview','Prévia e propriedades'],['contract','Contrato'],['semantics','Semântica e testes']] as const).map(([value,label])=><button key={value} type="button" role="tab" aria-selected={tab===value} onClick={()=>setTab(value)} className={`rounded-md px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-ring ${tab===value?'bg-background font-semibold shadow-sm':'hover:bg-muted'}`}>{label}</button>)}
    </div>
    {tab==='contract' ? <ContractDetails type={selectedType}/> : tab==='semantics' ? <div className="space-y-4">
     {kind==='primitive' && <ReuiGuidance type={selectedType}/>}
     <SemanticKnowledgePanel type={selectedType}/>
     {kind==='primitive' && pilotFamilies.some(family=>family===selectedType) && <CompositionRecommendationPanel key={selectedType} family={selectedType as (typeof pilotFamilies)[number]}/>}
    </div> : spec ? <LivePropsEditor key={`${kind}:${selectedType}`} type={selectedType} original={spec} source={sample?.source??''}/> : <p role="status" className="rounded-lg border p-4 text-sm text-muted-foreground">Exemplo não disponível para este componente.</p>}
   </>}
   </div>
  </div>
 </section>;
}
export function PrimitiveExplorer(){return <ComponentExplorer kind="primitive"/>;}
export function CompositeExplorer(){
 const [library,setLibrary]=useState<'approved'|'reui'|'candidates'>(()=>
  new URLSearchParams(window.location.search).get('screen')==='catalogo-pi'?'candidates':new URLSearchParams(window.location.search).has('reui')?'reui':'approved');
 return <section className="min-w-0 space-y-4" aria-label="Explorador de componentes compostos">
  <div role="tablist" aria-label="Biblioteca de compostos" className="inline-flex max-w-full flex-wrap gap-1 rounded-md border bg-muted/25 p-1">
   <button type="button" role="tab" aria-selected={library==='approved'}
    className={`rounded px-3 py-2 text-sm ${library==='approved'?'bg-background font-semibold shadow-sm':'hover:bg-background/60'}`}
    onClick={()=>setLibrary('approved')}>Contratos</button>
   <button type="button" role="tab" aria-selected={library==='reui'}
    className={`rounded px-3 py-2 text-sm ${library==='reui'?'bg-background font-semibold shadow-sm':'hover:bg-background/60'}`}
    onClick={()=>setLibrary('reui')}>ReUI (559)</button>
   <button type="button" role="tab" aria-selected={library==='candidates'} className={`rounded px-3 py-2 text-sm ${library==='candidates'?'bg-background font-semibold shadow-sm':'hover:bg-background/60'}`} onClick={()=>setLibrary('candidates')}>Candidatos experimentais</button>
  </div>
  {library==='approved'?<ComponentExplorer kind="composite"/>:library==='reui'?<ReuiCompositeExplorer/>:<AdmissionExplorer compositionOnly/>}
 </section>;
}
export function ExamplesExplorer(){
 const [selectedSource,setSelectedSource]=useState(screenOptions[0]?.id??'exemplo-01');
 const [selectedNode,setSelectedNode]=useState<string>('');
 const [query,setQuery]=useState('');
 const [sourceType,setSourceType]=useState<'screens'|'patterns'>('screens');
 const selectedScreen=screenOptions.find(x=>x.id===selectedSource)??screenOptions[0];
 const meta=Object.values(patternMeta).sort((a,b)=>a.title.localeCompare(b.title));
 const matched=sourceType==='screens'?selectedScreen?.spec:patternFiles[`../ui-patterns/${selectedSource}.json`];
 const sourcePath=sourceType==='screens'?selectedScreen?.path:`../ui-patterns/${selectedSource}.json`;
 const currentId=matched?.elements[selectedNode]?selectedNode:matched?.root;
 const candidateNodes=Object.entries(matched?.elements??{}).filter(([,node])=>types.includes(node.type)&&[node.type,node.props?.title,node.props?.label,node.props?.text].some(x=>String(x??'').toLowerCase().includes(query.toLowerCase())));
 const currentNode=currentId?matched?.elements[currentId]:undefined;
 const selectMode=(mode:'screens'|'patterns')=>{setSourceType(mode);setSelectedSource(mode==='screens'?screenOptions[0]?.id??'exemplo-01':meta[0]?.id??'dashboard-kpis');setSelectedNode('');setQuery('');};
 return <section className="min-w-0 space-y-5" aria-label="Explorador visual de exemplos">
  <header><h2 className="text-lg font-semibold">Exemplos e padrões</h2><p className="text-sm text-muted-foreground">Inspecione a árvore de uma tela completa e altere as propriedades de qualquer nó selecionado sem modificar o JSON original.</p></header>
  <div className="grid min-w-0 gap-4 lg:grid-cols-[275px_minmax(0,1fr)]">
   <aside className="min-w-0 space-y-3 rounded-lg border border-border bg-card p-3 lg:max-h-[760px] lg:overflow-y-auto">
    <div role="group" aria-label="Fonte de exemplos" className="grid grid-cols-2 gap-1 rounded-md border p-1"><button type="button" className={`rounded p-2 text-xs ${sourceType==='screens'?'bg-primary text-primary-foreground':''}`} onClick={()=>selectMode('screens')}>Telas</button><button type="button" className={`rounded p-2 text-xs ${sourceType==='patterns'?'bg-primary text-primary-foreground':''}`} onClick={()=>selectMode('patterns')}>Padrões</button></div>
    <label className="block text-xs font-semibold" htmlFor="example-source">Exemplo</label>
    <select id="example-source" className="w-full rounded-md border border-input bg-background p-2 text-sm" value={selectedSource} onChange={e=>{setSelectedSource(e.target.value);setSelectedNode('');setQuery('');}}>
     {sourceType==='screens'?screenOptions.map(v=><option key={v.id} value={v.id}>{v.title}</option>):meta.map(v=><option key={v.id} value={v.id}>{v.title}</option>)}</select>
    <label htmlFor="example-node-search" className="block text-xs font-semibold">Filtrar nós</label><input id="example-node-search" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Tipo, texto ou título"/>
    <div role="group" aria-label="Elementos do exemplo" className="space-y-1">{candidateNodes.map(([id,node])=><button key={id} type="button" aria-current={id===currentId?'true':undefined} onClick={()=>setSelectedNode(id)} className={`block w-full truncate rounded-md px-3 py-2 text-left text-sm ${id===currentId?'bg-secondary font-semibold':'hover:bg-muted'}`} title={`${id} (${node.type})`}><strong>{node.type}</strong> <span className="text-xs text-muted-foreground">{id}</span></button>)}</div>
    {!candidateNodes.length&&<p className="text-xs text-muted-foreground">Nenhum nó corresponde ao filtro.</p>}
   </aside>
   <div className="min-w-0 space-y-4">
    <div className="rounded-lg border border-border bg-card p-4"><h3 className="font-semibold">{sourceType==='screens'?selectedScreen?.title:meta.find(x=>x.id===selectedSource)?.title}</h3>
     <p className="mt-1 text-xs text-muted-foreground">{sourcePath} · {Object.keys(matched?.elements??{}).length} nós · o editor aplica alterações apenas na prévia.</p></div>
    {matched&&currentNode&&currentId&&<LivePropsEditor key={`${sourceType}:${selectedSource}:${currentId}`} type={currentNode.type} original={matched} targetId={currentId} source={sourcePath??''}/>}
   </div>
  </div>
 </section>;
}

import { ReuiCompositeExplorer } from './reui-composite-explorer';
import {ReuiPreview} from '@/ui-catalog/extensions/composites/reui-preview';
import {ReuiSourceViewer} from '@/ui-catalog/extensions/composites/reui-source-viewer';
import {filterReuiExamples} from './reui-search';

type Guide = {whenUse:string[];whenNotUse:string[];agentNotes:string[];examples:[string,string][]};
const guides=reuiGuidance as unknown as Record<string,Guide>;
type ExampleGuide = {bestFor:string;whenNotUse:string[];sourceUrl:string;language:'pt-BR'};
const exampleGuides = reuiExampleGuidancePtBr as Record<string,ExampleGuide>;
const readableReuiCriterion = (text:string) => text.replace(/\s*\(get_(?:example|component)\("[^"]+"\)\)/g, '');
const names=Object.keys(guides).sort((a,b)=>a.localeCompare(b));
export function ReuiGallery(){
 const [search,setSearch]=useState('');
 const [component,setComponent]=useState('Accordion');
 const [limit,setLimit]=useState(12);
 const selected=component==='all'?names:[component];
 const groups=useMemo(()=>selected.map(name=>({name,items:filterReuiExamples(guides[name]?.examples??[],name,search,exampleGuides)})).filter(g=>g.items.length>0),[component,search]);
 const all=groups.flatMap(g=>g.items.map(item=>({...{kind:g.name},title:item[0],id:item[1]})));
 const visible=all.slice(0,limit);
 return <section aria-label="ReUI" className="min-w-0 space-y-5">
  <div className="grid gap-3 rounded-lg border bg-card p-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
   <label className="grid gap-1 text-xs font-medium">Componente
    <select aria-label="Filtrar componente" className="w-full rounded-md border bg-background px-3 py-2 text-sm" value={component} onChange={e=>{setComponent(e.target.value);setLimit(12);}}>
     <option value="all">Todos os componentes catalogados</option>{names.map(name=><option value={name} key={name}>{name} ({guides[name].examples.length})</option>)}
    </select>
   </label>
   <label className="grid gap-1 text-xs font-medium">Pesquisar exemplo
    <input aria-label="Pesquisar exemplos" className="w-full rounded-md border bg-background px-3 py-2 text-sm" placeholder="Título, componente, melhor para ou quando não usar" value={search} onChange={e=>{setSearch(e.target.value);setLimit(12);}}/>
   </label>
  </div>
  <p aria-live="polite" className="text-xs text-muted-foreground">Exibindo {visible.length} de {all.length} exemplos encontrados. Os exemplos restantes não são renderizados até solicitar mais.</p>
  {names.filter(n=>visible.some(v=>v.kind===n)).map(name=><section key={name} className="space-y-3">
   <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2"><h3 className="text-lg font-semibold">{name}</h3><a target="_blank" rel="noopener noreferrer" className="text-sm underline" href={`https://reui.io/components/${name.replace(/([a-z0-9])([A-Z])/g,'$1-$2').toLowerCase()}`}>Ver todos no ReUI ↗</a></div>
   <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{visible.filter(v=>v.kind===name).map(({id,title})=><article key={id} className="flex min-w-0 flex-col overflow-hidden rounded-xl border bg-card">
    <div className="flex min-h-36 flex-1 items-center justify-center overflow-hidden bg-muted/25 p-4" data-testid={`reui-preview-${id}`}>
     <ReuiPreview kind={name} id={id}/>
    </div>
    <div className="space-y-3 border-t p-3">
     <h4 className="text-sm font-medium">{title}</h4>
     <ReuiSourceViewer id={id}/>
     <a className="inline-flex text-xs underline underline-offset-2" href={`?screen=explorador-compostos&reui=${encodeURIComponent(id)}`}>Abrir componente composto →</a>
     {exampleGuides[id] ? <div className="space-y-2 border-t pt-3 text-xs leading-relaxed" data-testid={`reui-guidance-${id}`}>
      <div><h5 className="font-semibold">Melhor para</h5><p lang={exampleGuides[id].language} className="mt-1 text-muted-foreground">{exampleGuides[id].bestFor}</p></div>
      <details className="group rounded-md border bg-muted/20 px-3 py-2">
       <summary className="cursor-pointer font-medium">Quando não usar <span className="font-normal text-muted-foreground">({exampleGuides[id].whenNotUse.length})</span></summary>
       <ul lang={exampleGuides[id].language} className="mt-2 list-disc space-y-1 pl-4 text-muted-foreground">{exampleGuides[id].whenNotUse.map((reason,i)=><li key={i}>{readableReuiCriterion(reason)}</li>)}</ul>
       <a className="mt-2 inline-block underline underline-offset-2" href={exampleGuides[id].sourceUrl} target="_blank" rel="noopener noreferrer">Critérios originais no ReUI ↗</a>
      </details>
     </div> : <p className="border-t pt-2 text-xs text-muted-foreground">Critérios específicos deste exemplo ainda não sincronizados. <a className="underline" href={`https://reui.io/components/${name.replace(/([a-z0-9])([A-Z])/g,'$1-$2').toLowerCase()}/${id}`} target="_blank" rel="noopener noreferrer">Consultar ReUI ↗</a></p>}
    </div>
   </article>)}</div>
  </section>)}
  {!visible.length&&<p className="rounded-lg border p-6 text-center text-sm text-muted-foreground">Nenhum exemplo corresponde aos filtros.</p>}
  {limit<all.length&&<button className="mx-auto block rounded-md border bg-background px-4 py-2 text-sm hover:bg-muted" onClick={()=>setLimit(n=>n+12)} type="button">Carregar mais 12 exemplos</button>}
 </section>;
}
