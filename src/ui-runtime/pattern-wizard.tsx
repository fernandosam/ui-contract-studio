import {useState} from "react";
import {SpecScreen} from "./spec-screen";
import {tracePattern} from "../ui-requirements/traceability";
import {improveLayoutQuality} from "../ui-requirements/layout-repair";
import {LayoutQualityPanel} from "./layout-quality-panel";
import {planPatternLayout} from "../ui-requirements/pattern-layout";
import {getPatternFlow,activePatternQuestions,inferPattern,supportedPatterns,resolvePattern,generatePatternPreview} from "../ui-requirements/patterns";
import type {Answers,Answer} from "../ui-requirements/schema";

/** Secondary safe authoring tool; pattern catalogs remain approved JSON trees. */
export function PatternWizard(){
 const [pattern,setPattern]=useState("login");
 const [intent,setIntent]=useState("");
 const [provided,setProvided]=useState<Answers>({});
 const [show,setShow]=useState(false);
 const flow=getPatternFlow(pattern);
 if(!flow)return <p role="alert">Padrão não encontrado.</p>;
 const requirements=resolvePattern(pattern,provided,intent);
 const inferredFlow=intent.trim()?inferPattern(intent):null;
 const generated=show&&!requirements.missing.length?generatePatternPreview(requirements):null;
 const refinement=generated?improveLayoutQuality(requirements,generated):null;
 const preview=generated?(refinement?.screen as NonNullable<typeof generated>):null;
 const trace=preview?tracePattern(requirements,preview):null;
 const quality=refinement?.after??null;
 const semanticLayout=planPatternLayout(requirements);
 const answer=(id:string,value:Answer)=>{setProvided(p=>({...p,[id]:value}));setShow(false);};
 return <section data-testid="pattern-wizard" className="space-y-4">
  <label className="block space-y-2 text-sm font-medium">Descreva a interface
   <textarea aria-label="Descreva a interface" className="block w-full rounded-md border bg-background p-2" rows={2}
    value={intent} maxLength={500} placeholder="Ex.: dashboard com gráficos ou busca com filtro de datas"
    onChange={event=>{setIntent(event.target.value);setShow(false);
     const next=inferPattern(event.target.value);if(next&&next!==pattern){setPattern(next);setProvided({});}}}/>
  </label>
  {intent.trim()&&!inferredFlow&&<p className="text-xs text-muted-foreground">Intenção ambígua ou não reconhecida: selecione manualmente o tipo de tela.</p>}
  {Object.values(requirements.provenance).some(p=>p==="inferred")&&<p className="text-xs text-muted-foreground">Algumas escolhas foram sugeridas a partir do texto; podem ser alteradas antes de gerar.</p>}
  <label className="block space-y-2 text-sm font-medium">Tipo de tela
   <select aria-label="Tipo de tela" value={pattern}
    className="block w-full rounded-md border p-2 bg-background"
    onChange={event=>{setPattern(event.target.value);setProvided({});setShow(false);}}>
    {supportedPatterns.map(p=><option key={p.id} value={p.id}>{p.title}</option>)}
   </select>
  </label>
  <div className="rounded-lg border bg-card p-4 space-y-3">
   <h2 className="font-semibold">Decisões para {flow.title}</h2>
   {activePatternQuestions(pattern,requirements.answers).map(q=><label className="block space-y-1 text-sm" key={q.id}>
    <span className="block font-medium">{q.label}</span>
    {q.type==="boolean"?
      <input aria-label={q.label} type="checkbox" checked={(requirements.answers[q.id]??false)===true}
       onChange={e=>answer(q.id,e.target.checked)}/>:
     q.type==="select"?
      <select aria-label={q.label} className="w-full rounded-md border bg-background p-2"
       value={String(requirements.answers[q.id]??"")} onChange={e=>answer(q.id,e.target.value)}>
       {q.options?.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
      </select>:
      <input aria-label={q.label} className="w-full rounded-md border bg-background p-2"
       value={String(requirements.answers[q.id]??"")} maxLength={120} onChange={e=>answer(q.id,e.target.value)}/>}
   </label>)}
   {semanticLayout&&<div data-testid="pattern-layout-plan" className="rounded-md border p-3 space-y-1 text-sm">
    <p className="font-medium">Contrato semântico: {semanticLayout.flow}</p>
    <p className="text-muted-foreground">Ordem visual: {semanticLayout.regions.join(" → ")}.</p>
    <p className="text-muted-foreground">Leitura em coluna única no celular; grids somente com densidade admitida. Orientação semântica não autoriza novas APIs.</p>
   </div>}
   <p className="text-sm text-muted-foreground">Somente visualização demonstrativa. Não há autenticação, gravação ou operações CRUD remotas.</p>
   {requirements.missing.length>0&&<p role="alert">Respostas pendentes: {requirements.missing.join(", ")}</p>}
   <button type="button" disabled={requirements.missing.length>0}
    onClick={()=>setShow(true)} className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground disabled:opacity-40">
    Gerar interface do padrão</button>
  </div>
  {preview&&<div data-testid="pattern-preview" className="rounded-lg border bg-card p-4 space-y-3">
    <h3 className="font-semibold">Prévia JSON com contratos admitidos</h3><SpecScreen spec={preview}/>
    {quality&&<LayoutQualityPanel report={quality} refinement={refinement??undefined}/>}
    {trace&&<details data-testid="pattern-traceability" className="rounded-md border p-3 text-sm">
      <summary className="cursor-pointer font-medium">Requisitos e verificações estáticas</summary>
      <p className="mt-2 text-muted-foreground">Estrutura: {trace.structurallyValid?"válida":"inconsistente"}. Interações ainda dependem de testes independentes.</p>
      <ul className="mt-2 list-disc space-y-2 pl-5">{trace.requirements.map(item=><li key={item.id}>
        <strong>{item.id}</strong>: {item.status} — {item.explanation}
        <span className="block text-muted-foreground">Origem: {item.origin}; nós: {item.nodeIds.join(", ")||"nenhum"}</span>
      </li>)}</ul>
    </details>}
   </div>}
 </section>;
}
