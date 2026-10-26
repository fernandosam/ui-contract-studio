import {useMemo,useState} from "react";
import official from "../../pi-catalog/contracts.json";
import {SpecScreen} from "./spec-screen";

const stableExamples=import.meta.glob("../../pi-catalog/examples/*.json",{eager:true,import:"default"}) as Record<string,unknown>;
const experimentalExamples=import.meta.glob("../../pi-catalog/experimental-examples/*.json",{eager:true,import:"default"}) as Record<string,unknown>;
const examples={...stableExamples,...experimentalExamples};
const entries=official.entries;

export function AdmissionExplorer() {
 const [query,setQuery]=useState("");
 const [filter,setFilter]=useState("all");
 const [channel,setChannel]=useState<"stable"|"experimental">("stable");
 const [selected,setSelected]=useState<string>("TypedConfirmationDialog");
 const visible=useMemo(()=>entries.filter(entry=>{
  const status=entry.lifecycle==="experimental"?"experimental":"stable";
  return (filter==="all"||status===filter)&&entry.type.toLowerCase().includes(query.toLowerCase().trim());
 }),[query,filter]);
 const current=visible.find(entry=>entry.type===selected)??visible[0];
 const sample=current?examples["../../"+current.example]:undefined;
 const canPreview=Boolean(current && (current.availability.piStable||channel==="experimental"));
 return <section aria-label="Catálogo oficial de contratos Pi" className="space-y-4" data-testid="admission-catalog">
   <header className="rounded-xl border bg-card p-5">
    <h2 className="text-lg font-semibold">Catálogo oficial · maturidade dos contratos</h2>
    <p className="mt-1 text-sm text-muted-foreground">
     {official.catalogSize} contratos legados e {official.experimentalCatalogSize} composições adicionais no mesmo manifesto.
     Componentes pendentes exigem habilitação explícita para testes locais.
    </p>
   </header>
   <div className="grid gap-4 lg:grid-cols-[minmax(250px,320px)_minmax(0,1fr)]">
    <aside className="min-w-0 space-y-3 rounded-xl border bg-card p-4">
     <label className="grid gap-1 text-xs font-medium">Buscar componente
      <input value={query} onChange={event=>setQuery(event.target.value)} placeholder="Nome do contrato"
       className="w-full rounded-md border bg-background px-3 py-2 text-sm" type="search" />
     </label>
     <label className="grid gap-1 text-xs font-medium">Maturidade
      <select value={filter} onChange={event=>setFilter(event.target.value)}
       className="rounded-md border bg-background px-3 py-2 text-sm">
       <option value="all">Todos ({entries.length})</option>
       <option value="stable">Estáveis (legado ou com E2E)</option>
       <option value="experimental">Experimentais (E2E pendente)</option>
      </select>
     </label>
     <div role="list" className="max-h-[520px] space-y-1 overflow-y-auto">
      {visible.map(entry=><button key={entry.type} type="button"
       onClick={()=>setSelected(entry.type)}
       aria-current={current?.type===entry.type?"true":undefined}
       className={"flex w-full items-center justify-between gap-2 rounded-md p-2 text-left text-sm hover:bg-muted "+(current?.type===entry.type?"bg-muted font-semibold":"")}>
       <span className="min-w-0 truncate">{entry.type}</span>
       <span className={"shrink-0 rounded-full border px-2 py-0.5 text-[10px] "+(entry.lifecycle==="experimental"?"border-amber-500/30 text-amber-700 dark:text-amber-400":"text-emerald-700 dark:text-emerald-400")}>
        {entry.lifecycle==="experimental"?"Experimental":entry.validation.e2e==="passed"?"E2E aprovado":"Legado"}
       </span>
      </button>)}
     </div>
    </aside>
    <main className="min-w-0 space-y-4">
     {current?<div className="space-y-4">
      <article className="space-y-3 rounded-xl border bg-card p-4">
       <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-base font-semibold">{current.type}</h3>
        <span className="rounded-full border px-2 py-0.5 text-xs">{current.lifecycle==="experimental"?"E2E pendente":current.validation.e2e==="passed"?"E2E aprovado":"Legado: E2E não registrado"}</span>
       </div>
       <p className="text-xs text-muted-foreground">Versão: {current.version} · Disponível no Pi experimental: sim · Pi estável: {current.availability.piStable?"sim":"não"}</p>
       {"sourceDigest" in current&&typeof current.sourceDigest==="string"&&
        <p className="break-all font-mono text-[11px] text-muted-foreground">Fingerprint SHA-256: {current.sourceDigest}</p>}
       <label className="grid max-w-sm gap-1 text-xs font-medium">Canal de prévia
        <select aria-label="Canal Pi" value={channel} onChange={event=>setChannel(event.target.value as "stable"|"experimental")}
         className="rounded-md border bg-background px-3 py-2 text-sm">
         <option value="stable">Estável (padrão)</option>
         <option value="experimental">Experimental (opt-in)</option>
        </select>
       </label>
      </article>
      <section className="min-w-0 rounded-xl border bg-card p-4" aria-label="Prévia do contrato">
       <h4 className="mb-3 text-sm font-semibold">Prévia com contrato Zod real</h4>
       {!canPreview?<p role="status" className="rounded-md border border-amber-400/30 p-3 text-sm">
        Este componente ainda não passou pelo E2E completo. Selecione o canal experimental para testá-lo localmente.
       </p>:sample?<SpecScreen key={current.type+"-"+channel} spec={sample} channel={channel}/>:
        <p className="text-sm text-muted-foreground">Exemplo não disponível.</p>}
      </section>
     </div>:<p className="rounded-xl border p-6 text-sm text-muted-foreground">Nenhum contrato corresponde à busca.</p>}
    </main>
   </div>
  </section>;
}
