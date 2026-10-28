import {useState} from "react";
import {TypedConfirmationPilot} from "./typed-confirmation-pilot";
import {
  getCompositionRecommendation,
  pilotFamilies,
  recommendationScenarios,
  recommendFromRequirement,
  type PilotFamily,
  type Strategy,
  type CompositionKind,
} from "@/ui-catalog/recommendations/engine";

// Fixed, reviewed recipe sources: display only, never evaluated as JSX or imported as Pi code.
const recipeSources=import.meta.glob("../../scripts/composition-codegen/recipes/*.txt",{
  eager:true,query:"?raw",import:"default",
}) as Record<string,string>;
const recipeSource=(id:string,kind:"component.tsx"|"schema.ts")=>
  recipeSources["../../scripts/composition-codegen/recipes/"+id+"."+kind+".txt"]??"";
const strategyLabels:Record<Strategy,string>={
  "reuse-contract":"Reutilizar contrato aprovado",
  "declarative-composition":"Propor composição declarativa JSON",
  "react-candidate":"Propor componente React composto",
  "review-required":"Revisão de autorização necessária",
};
const approachLabels:Record<CompositionKind,string>={
  primitive:"Primitiva ou tipo Pi direto",
  "declarative-composition":"Composição declarativa (árvore JSON)",
  "react-composition":"Composição React com API tipada",
  "authorization-review":"Bloqueada para revisão de autorização",
};
const statusLabels:Record<string,string>={
  "available-approved-contract":"Contrato existente aprovado; sem nova autorização",
  "proposal-existing-contracts":"Proposta estrutural usando contratos aprovados; árvore sujeita ao validador Pi",
  "candidate-needs-admission":"Candidato React: não admitido automaticamente",
  "blocked-review":"Sem recomendação executável até revisão independente",
};
const evidenceLabels:Record<string,string>={
  "verified-static":"Disponível com evidência estática (não é certificação funcional)",
  "not-implemented":"Apenas documentado — não disponível no contrato",
  "runtime-review-required":"Comportamento pendente de validação no navegador",
  "missing-evidence":"Sem evidência de implementação verificável",
  "missing-record":"Sem registro semântico revisado",
};
const modeLabels:Record<string,string>={
  integration:"Teste de integração",
  "manual-a11y":"Acessibilidade manual",
  "security-review":"Revisão de segurança",
  visual:"Teste visual",
};

/** Standalone recommendation tool: no code generation, execution, or Pi admission. */
export function CompositionRecommendationPanel({family}:{family:PilotFamily}){
  const options=recommendationScenarios.filter(item=>item.family===family);
  const [selected,setSelected]=useState(options[0]?.id??"");
  const [query,setQuery]=useState("");
  const [copied,setCopied]=useState("");
  const copyRecipe=(value:string,kind:string)=>{
    if(!navigator.clipboard?.writeText)return;
    void navigator.clipboard.writeText(value).then(()=>setCopied(kind)).catch(()=>setCopied("failed"));
  };
  const found=query.trim() ? recommendFromRequirement(query,family) : null;
  const result=found?.status==="matched" ? found.recommendation :
    found ? null : getCompositionRecommendation(selected);
  return <section className="min-w-0 space-y-3 rounded-lg border border-border bg-card p-4"
    aria-label={"Recomendação de composição para "+family} data-testid="composition-recommendations">
    <div className="flex flex-wrap items-start justify-between gap-2">
      <div className="space-y-1">
        <h4 className="font-semibold">Recomendação de composição · {family}</h4>
        <p className="text-xs text-muted-foreground">Motor determinístico, consultivo e limitado a cenários revisados. Nenhum contrato Pi é criado.</p>
      </div>
      <span className="rounded-md bg-secondary px-2 py-1 text-xs">{options.length} situações</span>
    </div>
    <div className="grid min-w-0 gap-3 sm:grid-cols-2">
      <label className="grid min-w-0 gap-1 text-xs font-medium">Situação funcional
        <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          aria-label="Situação funcional" value={selected}
          onChange={event=>{setSelected(event.target.value);setQuery("");}}>
          {options.map(item=><option key={item.id} value={item.id}>{item.title}</option>)}
        </select>
      </label>
      <label className="grid min-w-0 gap-1 text-xs font-medium">Descrever necessidade (opcional)
        <input className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          type="search" maxLength={500} value={query}
          onChange={event=>setQuery(event.target.value)}
          placeholder="Ex.: confirmação por texto"
          aria-label="Descrever necessidade funcional"/>
      </label>
    </div>
    {found && found.status!=="matched" && <div role="status" className="rounded-md border border-dashed p-3 text-sm">
      <p className="font-medium">{found.status==="ambiguous"?
        "A descrição corresponde a mais de um cenário.":
        "Não há correspondência segura para a descrição."}</p>
      <p className="mt-1 text-xs text-muted-foreground">Escolha explicitamente uma situação abaixo. Não será inferida uma implementação sem correspondência.</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {found.candidates.map(item=><button key={item.id} type="button"
          className="rounded-md border px-2 py-1 text-xs hover:bg-muted"
          onClick={()=>{setSelected(item.id);setQuery("");}}>{item.title}</button>)}
      </div>
    </div>}
    {result&&<>
      <div className="space-y-2 rounded-md bg-muted/40 p-3" data-testid="recommendation-decision">
        <p className="text-xs text-muted-foreground">Necessidade: {result.scenario.need}</p>
        <p className="text-sm font-semibold">{strategyLabels[result.decision]}
          {result.target&&<span className="ml-1 font-mono">· {result.target}</span>}</p>
        <p className="text-sm">{result.scenario.reason}</p>
        <p className="text-xs font-semibold" data-testid="recommendation-approach">
          Abordagem: {approachLabels[result.selection.kind]}
        </p>
        <p className="text-xs text-muted-foreground" data-testid="recommendation-admission-status">
          {statusLabels[result.selection.status]}
        </p>
        <p className="text-xs text-muted-foreground">
          {result.targetApproved?"O alvo já é um contrato Pi aprovado.":
            result.selection.kind==="declarative-composition"
              ?"As dependências são contratos existentes; a composição proposta não é novo tipo Pi."
              :"Nenhum novo contrato Pi é autorizado para esta finalidade."}
        </p>
      </div>
      <div className="space-y-2 rounded-md border p-3" data-testid="recommendation-criteria">
        <h5 className="text-sm font-medium">Critérios de escolha e referências verificáveis</h5>
        <ul className="list-disc space-y-2 pl-4 text-xs">
          {result.selection.criteria.map((criterion,index)=><li key={index}>
            <span>{criterion.rule}</span>
            <span className="block break-all font-mono text-[11px] text-muted-foreground">
              {criterion.reference}
            </span>
          </li>)}
        </ul>
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        <div className="space-y-2 rounded-md border p-3">
          <h5 className="text-sm font-medium">Dependências e lacunas</h5>
          <ul className="space-y-1.5 text-xs">
            {result.dependencies.map(dep=><li key={dep.name}>
              <span className="font-mono">{dep.name}</span>
              <span className="text-muted-foreground"> · {dep.piApproved?"Tipo aprovado":"Não aprovado"}</span>
            </li>)}
          </ul>
          {result.evidence.map(item=><div key={item.capability} className="text-xs">
            <strong>{item.capability}:</strong> <span className="text-muted-foreground">{evidenceLabels[item.availability]??item.state}</span>
            {item.availability==="verified-static"&&<p className="mt-1 break-all text-[11px] text-muted-foreground">
              Fonte: {item.source} · {item.codeEvidence.map(source=>source.path).join(", ")}
            </p>}
          </div>)}
          {result.gaps.length>0&&<p className="text-xs text-muted-foreground">
            {result.gaps.length} capacidade(s) pendente(s): não confundir documentação ou revisão de runtime com implementação disponível.
          </p>}
          {result.evidence.length===0&&<p className="text-xs text-muted-foreground">Sem capacidades vinculadas ao cenário; a aprovação do alvo depende exclusivamente do catálogo Pi.</p>}
          {result.gaps.length===0&&result.evidence.length>0&&<p className="text-xs text-muted-foreground">Todas as capacidades vinculadas têm evidência estática. Execução e acessibilidade exigem testes próprios.</p>}
        </div>
        <div className="space-y-2 rounded-md border p-3">
          <h5 className="text-sm font-medium">Riscos e limites</h5>
          <ul className="list-disc space-y-1 pl-4 text-xs text-muted-foreground">
            {result.scenario.risks.map(risk=><li key={risk}>{risk}</li>)}
          </ul>
        </div>
      </div>
      <div className="space-y-2 rounded-md border p-3">
        <h5 className="text-sm font-medium">Plano de testes sugerido</h5>
        <p className="text-xs text-muted-foreground">Critérios de validação planejados; não executados automaticamente.</p>
        <ol className="list-decimal space-y-2 pl-4 text-xs">
          {result.tests.map((item,index)=><li key={index}>
            <strong>{modeLabels[item.mode]??item.mode}:</strong> {item.description}
          </li>)}
        </ol>
      </div>
      {result.decision==="react-candidate" && recipeSource(result.scenario.id,"component.tsx") && <details className="rounded-md border p-3" data-testid="generated-code-proposal">
        <summary className="cursor-pointer text-sm font-medium">Código proposto: React + Zod (revisão obrigatória)</summary>
        <p className="mt-2 text-xs text-muted-foreground">Prévia de receitas estáticas revisáveis. Copiar não admite nem executa o componente. Para produzir o pacote completo com testes e manifesto, use o gerador CLI.</p>
        {(["component.tsx","schema.ts"] as const).map(kind=>{
          const text=recipeSource(result.scenario.id,kind);
          return <div key={kind} className="mt-3 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <h5 className="text-xs font-semibold">{kind==="component.tsx"?"Componente React":"Schema Zod proposto"}</h5>
              <button type="button" className="rounded-md border px-3 py-1.5 text-xs hover:bg-muted"
                onClick={()=>copyRecipe(text,kind)} aria-label={"Copiar fonte "+kind}>Copiar</button>
            </div>
            <pre className="max-h-64 overflow-auto rounded-md bg-muted p-3 text-xs"><code>{text}</code></pre>
          </div>;
        })}
        <p role="status" className="text-xs text-muted-foreground">
          {copied==="failed"?"Não foi possível copiar automaticamente; selecione o código acima.":
           copied?"Fonte copiada: "+copied:""}
        </p>
        <p className="font-mono text-xs">npm run composites:generate -- --id={result.scenario.id}</p>
      </details>}
      {result.scenario.id==="alert-typed" && <TypedConfirmationPilot/>}
      <p className="text-xs text-muted-foreground">Evidências consultadas: {result.provenance.join(" · ")}</p>
      <p className="text-xs font-medium">A recomendação não habilita JSX arbitrário, propriedades, eventos, rede ou operações destrutivas; novos compostos exigem contrato Zod, implementação e revisão.</p>
    </>}
  </section>;
}
export {pilotFamilies};
