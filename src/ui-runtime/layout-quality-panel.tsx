import {useEffect,useState,type RefObject} from "react";
import {evaluateRenderedLayout,type RuntimeLayoutQualityReport} from "./layout-runtime-quality";
import type {LayoutQualityReport} from "../ui-requirements/layout-quality";
import type {LayoutRepairResult} from "../ui-requirements/layout-repair";

const titles={
 hierarchy:"Hierarquia",grouping:"Agrupamento",density:"Densidade",responsiveness:"Responsividade"
} as const;

/** Informational feedback, not a certification or an additional approval gate. */
export function LayoutQualityPanel({report,refinement,surfaceRef}:{report:LayoutQualityReport;refinement?:LayoutRepairResult;surfaceRef:RefObject<HTMLDivElement|null>}){
 const [browser,setBrowser]=useState<RuntimeLayoutQualityReport|null>(null);
 useEffect(()=>{
  const surface=surfaceRef.current;
  if(!surface)return;
  let active=true,frame=0;
  const measure=()=>{
   if(!active)return;
   const measured=evaluateRenderedLayout(surface);
   setBrowser(previous=>JSON.stringify(previous)===JSON.stringify(measured)?previous:measured);
  };
  const schedule=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(measure);};
  const observer=typeof ResizeObserver!=="undefined"?new ResizeObserver(schedule):null;
  observer?.observe(surface);
  window.addEventListener("resize",schedule);
  schedule();
  void document.fonts?.ready.then(schedule);
  return ()=>{active=false;cancelAnimationFrame(frame);observer?.disconnect();window.removeEventListener("resize",schedule);};
 },[surfaceRef,report.flow,report.score]);
 return <section data-testid="layout-quality" aria-label="Qualidade estimada do layout" className="rounded-md border p-3 space-y-3 text-sm">
  <div>
   <h3 className="font-semibold">Qualidade estimada do layout: {report.score}/100</h3>
   <p className="text-xs text-muted-foreground">Análise automática do JSON gerado, sem nova aprovação e sem autorizar APIs.</p>
  </div>
  <div className="grid gap-3 sm:grid-cols-2">
   {(Object.keys(titles) as (keyof typeof titles)[]).map(key=><div key={key}>
    <div className="flex justify-between gap-2"><span>{titles[key]}</span><output>{report.scores[key]}/25</output></div>
    <progress className="w-full h-2" aria-label={titles[key]} value={report.scores[key]} max={25}/>
   </div>)}
  </div>
  {refinement?.status==="improved"&&<details data-testid="layout-quality-repair" className="rounded-md border p-3 text-sm">
   <summary className="cursor-pointer font-medium">
    Correção automática segura: {refinement.before?.score} → {refinement.after?.score}/100 ({refinement.edits.length} ajustes)
   </summary>
   <p className="mt-2 text-xs text-muted-foreground">Alterações exclusivamente em memória, conferidas pelo catálogo Pi e pela rastreabilidade de requisitos.</p>
   <ul className="mt-2 list-disc space-y-1 pl-5">
    {refinement.edits.map(edit=><li key={edit.path}>
     <strong>{edit.nodeId}</strong>: {edit.reason}
     <span className="block text-xs text-muted-foreground">{edit.path}</span>
    </li>)}
   </ul>
  </details>}
  {refinement&&refinement.before&&refinement.before.score<100&&refinement.status!=="improved"&&
   <p data-testid="layout-quality-repair-skipped" className="text-xs text-muted-foreground">
    Ajuste automático não aplicado: {refinement.reason} Os diagnósticos permanecem consultivos.
   </p>}
  {report.findings.length>0?<details data-testid="layout-quality-findings" className="text-sm">
   <summary className="cursor-pointer font-medium">Melhorias sugeridas ({report.findings.length})</summary>
   <ul className="mt-2 list-disc space-y-2 pl-5">
    {report.findings.map(item=><li key={item.dimension+":"+item.code}>
     <strong>{titles[item.dimension]} (−{item.deduction}):</strong> {item.message} {item.suggestion}
     <span className="block text-xs text-muted-foreground">Regra: {item.code}; nós: {item.nodeIds.join(", ")||"não disponíveis"}</span>
    </li>)}
   </ul>
  </details>:<p className="text-sm">Nenhuma divergência identificada pelas heurísticas estáticas.</p>}
  {browser?<div data-testid="layout-runtime-quality" data-runtime-score={browser.score} data-runtime-report={JSON.stringify(browser)} className="rounded-md border p-3 space-y-2">
   <h4 className="font-semibold">Medição executada no navegador: {browser.score}/100</h4>
   <p className="text-xs text-muted-foreground">Viewport {browser.viewport.width} × {browser.viewport.height} px; área da prévia {browser.viewport.surfaceWidth} px; {browser.checks.evaluated} verificações executadas, {browser.checks.notApplicable.length} não aplicáveis.</p>
   <div className="grid gap-2 sm:grid-cols-2">{(Object.keys(titles) as (keyof typeof titles)[]).map(key=><p key={key}>{titles[key]}: <strong>{browser.scores[key]}/25</strong></p>)}</div>
   {browser.findings.length>0?<details><summary className="cursor-pointer">Achados da renderização ({browser.findings.length})</summary>
    <ul className="mt-2 list-disc pl-5 space-y-1">{browser.findings.map(item=><li key={item.code}><strong>{titles[item.dimension]}:</strong> {item.message} {item.suggestion} <span className="text-xs text-muted-foreground">({item.code})</span></li>)}</ul>
   </details>:<p className="text-xs">Nenhuma divergência nas verificações aplicáveis deste viewport.</p>}
   <p className="text-xs text-muted-foreground">Medição consultiva, somente do viewport atual. Não comprova outros breakpoints, aparência subjetiva, acessibilidade ou autorização Pi.</p>
  </div>:<p data-testid="layout-runtime-unavailable" className="text-xs text-muted-foreground">Sem evidência geométrica executada nesta prévia.</p>}
  <p className="text-xs text-muted-foreground">A nota declarativa acima é independente da medição no navegador. Nenhuma delas autoriza contratos, alterações de Zod ou aprovação automática.</p>
 </section>;
}
