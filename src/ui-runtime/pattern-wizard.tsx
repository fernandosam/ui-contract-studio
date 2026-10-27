import {useState} from "react";
import {SpecScreen} from "./spec-screen";
import {getPatternFlow,supportedPatterns,resolvePattern,generatePatternPreview} from "../ui-requirements/patterns";
import type {Answers,Answer} from "../ui-requirements/schema";

/** Secondary safe authoring tool; pattern catalogs remain approved JSON trees. */
export function PatternWizard(){
 const [pattern,setPattern]=useState("login");
 const [provided,setProvided]=useState<Answers>({});
 const [show,setShow]=useState(false);
 const flow=getPatternFlow(pattern);
 if(!flow)return <p role="alert">Padrão não encontrado.</p>;
 const requirements=resolvePattern(pattern,provided);
 const preview=show&&!requirements.missing.length?generatePatternPreview(requirements):null;
 const answer=(id:string,value:Answer)=>{setProvided(p=>({...p,[id]:value}));setShow(false);};
 return <section data-testid="pattern-wizard" className="space-y-4">
  <label className="block space-y-2 text-sm font-medium">Tipo de tela
   <select aria-label="Tipo de tela" value={pattern}
    className="block w-full rounded-md border p-2 bg-background"
    onChange={event=>{setPattern(event.target.value);setProvided({});setShow(false);}}>
    {supportedPatterns.map(p=><option key={p.id} value={p.id}>{p.title}</option>)}
   </select>
  </label>
  <div className="rounded-lg border bg-card p-4 space-y-3">
   <h2 className="font-semibold">Decisões para {flow.title}</h2>
   {flow.questions.map(q=><label className="block space-y-1 text-sm" key={q.id}>
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
   <p className="text-sm text-muted-foreground">Somente visualização demonstrativa. Não há autenticação, gravação ou operações CRUD remotas.</p>
   {requirements.missing.length>0&&<p role="alert">Respostas pendentes: {requirements.missing.join(", ")}</p>}
   <button type="button" disabled={requirements.missing.length>0}
    onClick={()=>setShow(true)} className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground disabled:opacity-40">
    Gerar interface do padrão</button>
  </div>
  {preview&&<div data-testid="pattern-preview" className="rounded-lg border bg-card p-4 space-y-3">
    <h3 className="font-semibold">Prévia JSON com contratos admitidos</h3><SpecScreen spec={preview}/>
   </div>}
 </section>;
}
