import { useMemo, useState } from 'react';
import { z } from 'zod';
import { componentDefinitions, catalog } from '@/ui-catalog/catalog';
import contractLock from '@/ui-catalog/contracts.lock.json';
import reuiGuidance from '@/ui-catalog/reui-guidance.json';
import reuiExampleGuidancePtBr from '@/ui-catalog/reui-example-guidance.pt-BR.json';
import shadcnGuidance from '@/ui-catalog/shadcn-guidance.json';
import primitiveGuidancePtBr from '@/ui-catalog/primitive-guidance.pt-BR.json';
import { PrimitiveSourceViewer } from '@/ui-catalog/extensions/composites/primitive-source-viewer';
import { SpecScreen } from './spec-screen';

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
const primitiveTypes = new Set(contractLock.components.filter(c=>c.tier==='base').map(c=>c.name).concat(['Field', 'AspectRatio', 'Kbd', 'Empty', 'ScrollArea', 'AlertDialog', 'Attachment', 'Bubble', 'ContextMenu', 'HoverCard', 'Item', 'Marker', 'Message']));
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

type Kind='primitive'|'composite';
function ComponentExplorer({kind}:{kind:Kind}){
 const available=kind==='primitive'?primitiveList:compositeList;
 const [search,setSearch]=useState('');
 const [type,setType]=useState(available[0]??'Card');
 const filtered=useMemo(()=>available.filter(t=>t.toLowerCase().includes(search.toLowerCase())),[search,available]);
 const sample=samples[type];
 const spec=sample?extractBranch(sample.spec,sample.id):undefined;
 return <section className="min-w-0 space-y-5" aria-label={kind==='primitive'?'Explorador de primitivos shadcn':'Explorador de componentes compostos'}>
  <header><h2 className="text-lg font-semibold">{kind==='primitive'?'Primitivos shadcn':'Componentes compostos'}</h2>
   <p className="text-sm text-muted-foreground">{available.length} contratos {kind==='primitive'?'de base e adaptadores oficiais':'com funcionalidades ou padrões reutilizáveis'} · edição local validada pelo Zod.</p></header>
  <div className="grid min-w-0 gap-4 lg:grid-cols-[245px_minmax(0,1fr)]">
   <aside className="min-w-0 rounded-lg border border-border bg-card p-3 lg:max-h-[720px] lg:overflow-y-auto">
    <label htmlFor="catalog-search" className="mb-2 block text-xs font-medium">Buscar componente</label>
    <input id="catalog-search" className="mb-3 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="Nome do componente" value={search} onChange={e=>setSearch(e.target.value)}/>
    <div className="space-y-1" aria-label="Componentes registrados">{filtered.map(name=><button type="button" key={name} aria-current={name===type?'true':undefined} onClick={()=>setType(name)} className={`block w-full rounded-md px-3 py-2 text-left text-sm ${name===type?'bg-secondary font-semibold':'hover:bg-muted'}`}>{name}</button>)}</div>
    {!filtered.length&&<p className="text-sm text-muted-foreground">Nenhum componente encontrado.</p>}
   </aside>
   <div className="min-w-0 space-y-4">
    <div className="rounded-lg border border-border bg-card p-4"><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-lg font-semibold">{type}</h3>
    <div className="flex flex-wrap items-center gap-2"><span className="rounded bg-secondary px-2 py-1 font-mono text-xs">v{versions.get(type)?.version??'—'}</span>{kind==='primitive'&&<PrimitiveSourceViewer key={type} type={type} example={spec}/>}</div></div>
    <p className="mt-2 text-sm text-muted-foreground">{componentDefinitions[type as keyof typeof componentDefinitions]?.description}</p>
    <p className="mt-3 text-xs"><strong>Propriedades:</strong> {getFields(type).map(f=>f.name).join(', ')||'nenhuma'} · <strong>Exemplo:</strong> {sample?.source??'não disponível'}</p></div>
    {kind==='primitive' && <ReuiGuidance type={type}/>}
    {spec&&<LivePropsEditor key={`${kind}:${type}`} type={type} original={spec} source={sample?.source??''}/>}
   </div>
  </div>
 </section>;
}
export function PrimitiveExplorer(){return <ComponentExplorer kind="primitive"/>;}
export function CompositeExplorer(){
 const [library,setLibrary]=useState<'approved'|'reui'>(()=>
  new URLSearchParams(window.location.search).has('reui')?'reui':'approved');
 return <section className="min-w-0 space-y-4" aria-label="Explorador de componentes compostos">
  <div role="tablist" aria-label="Biblioteca de compostos" className="inline-flex max-w-full flex-wrap gap-1 rounded-md border bg-muted/25 p-1">
   <button type="button" role="tab" aria-selected={library==='approved'}
    className={`rounded px-3 py-2 text-sm ${library==='approved'?'bg-background font-semibold shadow-sm':'hover:bg-background/60'}`}
    onClick={()=>setLibrary('approved')}>Contratos aprovados</button>
   <button type="button" role="tab" aria-selected={library==='reui'}
    className={`rounded px-3 py-2 text-sm ${library==='reui'?'bg-background font-semibold shadow-sm':'hover:bg-background/60'}`}
    onClick={()=>setLibrary('reui')}>Composições ReUI (559)</button>
  </div>
  {library==='approved'?<ComponentExplorer kind="composite"/>:<ReuiCompositeExplorer/>}
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
