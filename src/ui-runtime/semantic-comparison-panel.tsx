import type { SemanticComparisonEntry, ComparedCapability } from './semantic-comparison';
import { compareSemanticContracts } from './semantic-comparison';

const stateLabels: Record<string,string> = {
 'implemented-static-evidence':'Evidência estática no código (não é homologação)',
 'documented-not-implemented':'Documentada, não implementada',
 'runtime-review-required':'Requer validação em execução',
};
function GuidanceList({title,lines}:{title:string;lines:readonly string[]}) {
 return <div>
  <h5 className="mb-2 text-sm font-semibold">{title}</h5>
  {lines.length ? <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
   {lines.map((line,index)=><li key={index}>{line}</li>)}
  </ul> : <p className="text-xs text-muted-foreground">Sem orientação registrada; não concluir que não existam restrições.</p>}
 </div>;
}
function CapabilityList({items}:{items:readonly ComparedCapability[]}) {
 if(!items.length) return <p className="text-xs text-muted-foreground">Sem capacidades documentadas nesta fonte; ausência de registro não comprova ausência de implementação.</p>;
 return <ul className="space-y-2">{items.map(capability=><li key={capability.id} className="rounded-md border bg-muted/20 p-2 text-xs">
  <p className="font-medium">{capability.description}</p>
  <p className="mt-1 text-muted-foreground">{stateLabels[capability.state]??'Estado pendente de revisão'} · <code>{capability.id}</code></p>
 </li>)}</ul>;
}
function Side({entry}:{entry:SemanticComparisonEntry}){
 return <article className="min-w-0 space-y-4 rounded-lg border bg-card p-4" aria-label={`Perfil semântico de ${entry.name}`}>
  <div className="space-y-1">
   <h4 className="font-semibold">{entry.name}</h4>
   <p className="text-xs text-muted-foreground">Contrato v{entry.version??'não registrado'} · {entry.maturity??'estabilidade não registrada'} · {entry.piAvailable?'Pi disponível':'Pi não disponível'}</p>
   <p className="text-xs text-muted-foreground">{entry.reviewed?'Documentação semântica revisada':'Orientação parcial ou apenas descrição do contrato'}</p>
  </div>
  <div><h5 className="mb-1 text-sm font-semibold">Finalidade</h5><p className="text-sm text-muted-foreground">{entry.purpose??entry.description??'Finalidade não documentada.'}</p></div>
  <GuidanceList title="Quando usar" lines={entry.whenUse}/>
  <GuidanceList title="Quando evitar" lines={entry.whenNotUse}/>
  <div><h5 className="mb-2 text-sm font-semibold">Capacidades documentadas ({entry.capabilities.length})</h5><CapabilityList items={entry.capabilities}/></div>
  {entry.sourceUrl&&<p className="text-xs">Fonte: <a href={entry.sourceUrl} rel="noopener noreferrer" target="_blank" className="underline underline-offset-2">{entry.sourceProvider??'Documentação'}{entry.reviewedOn?` · revisão ${entry.reviewedOn}`:''}</a></p>}
 </article>;
}

export function SemanticComparisonPanel({
 primary, secondary, options, selection, onChange, onClose,
}:{
 primary:SemanticComparisonEntry;
 secondary?:SemanticComparisonEntry;
 options:readonly string[];
 selection:string;
 onChange:(name:string)=>void;
 onClose:()=>void;
}){
 const outcome=secondary&&secondary.name!==primary.name?compareSemanticContracts(primary,secondary):null;
 return <section data-testid="semantic-comparison" aria-label="Comparação semântica" className="min-w-0 space-y-4 rounded-xl border bg-muted/15 p-4">
  <div className="flex flex-wrap items-start justify-between gap-3">
   <div><h3 className="font-semibold">Comparação semântica</h3><p className="text-xs text-muted-foreground">Compare finalidades, recomendações, restrições e evidências existentes. Nenhuma aprovação ou alteração de contrato é realizada.</p></div>
   <button type="button" onClick={onClose} className="rounded-md border bg-background px-3 py-1.5 text-xs hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring">Fechar comparação</button>
  </div>
  <div className="grid items-end gap-3 sm:grid-cols-2">
   <p className="rounded-md border bg-background px-3 py-2 text-sm"><span className="block text-xs text-muted-foreground">Componente principal</span><strong>{primary.name}</strong></p>
   <div>
    <label htmlFor="catalog-compare-target" className="mb-1 block text-xs font-medium">Comparar com</label>
    <select id="catalog-compare-target" value={selection} onChange={event=>onChange(event.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-ring">
     <option value="">Selecione outro componente</option>
     {options.filter(name=>name!==primary.name).map(name=><option value={name} key={name}>{name}</option>)}
    </select>
   </div>
  </div>
  {!outcome||!secondary ? <p role="status" className="rounded-md border bg-background p-4 text-sm text-muted-foreground">Selecione um segundo componente para visualizar as diferenças semânticas.</p> : <>
   <div className="grid min-w-0 gap-4 lg:grid-cols-2">
    <Side entry={primary}/><Side entry={secondary}/>
   </div>
   <div className="rounded-lg border bg-card p-4 space-y-3">
    <h4 className="font-semibold">Diferenças de capacidades documentadas</h4>
    <p className="text-xs text-muted-foreground">A correspondência ocorre somente por ID exato. IDs diferentes não provam ausência de capacidade; IDs iguais não garantem comportamento ou API equivalentes. Os estados e as evidências devem ser examinados separadamente.</p>
    <div className="grid gap-3 md:grid-cols-3">
     <div><h5 className="mb-2 text-sm font-medium">IDs em comum ({outcome.shared.length})</h5>
      {outcome.shared.length?<ul className="space-y-2 text-xs">{outcome.shared.map(item=><li key={item.id} className="rounded-md bg-muted/40 p-2"><code>{item.id}</code><p className="mt-1 text-muted-foreground">{stateLabels[item.left.state]??item.left.state} / {stateLabels[item.right.state]??item.right.state}</p></li>)}</ul>:<p className="text-xs text-muted-foreground">Nenhum ID coincidente.</p>}
     </div>
     <div><h5 className="mb-2 text-sm font-medium">Somente {primary.name} ({outcome.onlyLeft.length})</h5><CapabilityList items={outcome.onlyLeft}/></div>
     <div><h5 className="mb-2 text-sm font-medium">Somente {secondary.name} ({outcome.onlyRight.length})</h5><CapabilityList items={outcome.onlyRight}/></div>
    </div>
    <p className="text-xs text-muted-foreground">A disponibilidade no Pi é derivada dos contratos revisados e do manifesto; conteúdo semântico não promove capacidades, schemas Zod ou permissões automaticamente.</p>
   </div>
  </>}
 </section>;
}
