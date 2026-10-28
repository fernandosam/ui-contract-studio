import type {LayoutQualityReport} from "../ui-requirements/layout-quality";
import type {LayoutRepairResult} from "../ui-requirements/layout-repair";

const titles={
 hierarchy:"Hierarquia",grouping:"Agrupamento",density:"Densidade",responsiveness:"Responsividade"
} as const;

/** Informational feedback, not a certification or an additional approval gate. */
export function LayoutQualityPanel({report,refinement}:{report:LayoutQualityReport;refinement?:LayoutRepairResult}){
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
  <p className="text-xs text-muted-foreground">Responsividade não foi medida no navegador. Nota consultiva: não certifica aparência, acessibilidade, E2E ou aprovação de contratos Pi.</p>
 </section>;
}
