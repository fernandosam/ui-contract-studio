import {useState} from "react";
import {SpecScreen} from "./spec-screen";

import {proposeFormFlow} from "../ui-requirements/form-proposal";
import {registrationFlow,defaultAnswers,activeQuestions,resolveAnswers,inferFlow} from "../ui-requirements/engine";
import {planInterface} from "../ui-requirements/planner";
import {generateRegistrationScreen} from "../ui-requirements/generator";
import {traceRegistration} from "../ui-requirements/traceability";
import type {Answers,Answer,Question} from "../ui-requirements/schema";

function QuestionControl({question,value,onChange}:{question:Question;value:Answer|undefined;onChange:(next:Answer)=>void}){
  const id="req-"+question.id;
  if(question.type==="boolean")return <label className="flex items-center gap-2 text-sm">
    <input id={id} type="checkbox" checked={value===true} onChange={event=>onChange(event.target.checked)}/>
    {value===true?"Sim":"Não"}
  </label>;
  if(question.type==="multi-select")return <div role="group" aria-label={question.label} className="grid gap-2 sm:grid-cols-2">
    {question.options?.map(choice=><label key={choice.value} className="flex items-center gap-2 rounded border p-2 text-sm">
      <input type="checkbox" checked={Array.isArray(value)&&value.includes(choice.value)}
        onChange={event=>onChange(event.target.checked?[...((value as string[])||[]),choice.value]:((value as string[])||[]).filter(x=>x!==choice.value))}/>
      {choice.label}
    </label>)}
  </div>;
  if(question.type==="select")return <select id={id} value={typeof value==="string"?value:""} onChange={event=>onChange(event.target.value)}
    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
    <option value="" disabled>Selecione...</option>
    {question.options?.map(option=><option value={option.value} key={option.value}>{option.label}</option>)}
  </select>;
  return <textarea id={id} value={typeof value==="string"?value:""} maxLength={2000}
    onChange={event=>onChange(event.target.value)} rows={question.id==="extraFields"?3:2}
    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"/>;
}
/** UI only orchestrates approved local-only contracts; no remote persistence is invented. */
export function RequirementsWizard(){
  const [intent,setIntent]=useState("Crie uma tela de cadastro de usuários");
  const [provided,setProvided]=useState<Answers>({});
  const [showPreview,setShowPreview]=useState(false);
  const answers={...defaultAnswers(),...provided};
  const requirements=resolveAnswers(provided,intent);
  const plan=planInterface(requirements);
  const recognized=inferFlow(intent)==="registration";
  const blocked=!recognized||plan.blockers.length>0;
  const preview=showPreview&&!blocked?generateRegistrationScreen(requirements):null;
  const trace=preview?traceRegistration(requirements,preview):null;
  const localCandidate=preview?proposeFormFlow(requirements):null;
  const update=(id:string,value:Answer)=>{setProvided(previous=>({...previous,[id]:value}));setShowPreview(false);};
  const copy=(kind:"requirements"|"screen")=>{
    const value=kind==="requirements"?requirements:preview;
    if(!value||!navigator.clipboard?.writeText)return;
    void navigator.clipboard.writeText(JSON.stringify(value,null,2)).catch(()=>{});
  };
  return <section data-testid="requirements-wizard" className="space-y-5">
    <div className="rounded-lg border bg-card p-4 space-y-2">
      <label htmlFor="intent" className="text-sm font-medium">Descreva a interface</label>
      <textarea id="intent" value={intent} maxLength={500} rows={2} onChange={e=>{setIntent(e.target.value);setShowPreview(false);}}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"/>
      {!recognized&&<p role="status" className="text-sm text-muted-foreground">Fluxo ainda não reconhecido. Este piloto suporta cadastros; não serão inferidos requisitos de outros tipos de tela.</p>}
    </div>
    <div className="rounded-lg border bg-card p-4 space-y-4">
      <div><h2 className="text-lg font-semibold">{registrationFlow.title}: decisões necessárias</h2>
        <p className="text-sm text-muted-foreground">Os padrões são sugestões. Persistência precisa de escolha explícita; campos extras são opcionais.</p></div>
      {activeQuestions(answers).map(question=><div key={question.id} className="space-y-2">
        <label htmlFor={"req-"+question.id} className="text-sm font-medium">{question.label}{question.required?" *":""}</label>
        <QuestionControl question={question} value={answers[question.id]} onChange={value=>update(question.id,value)}/>
      </div>)}
    </div>
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <h2 className="text-lg font-semibold">Plano e limites</h2>
      <p className="text-sm">Componentes propostos: {plan.components.join(", ")}</p>
      <div data-testid="registration-layout-plan" className="rounded-md border p-3 space-y-2 text-sm">
        <p className="font-medium">Contrato semântico do layout: cadastro</p>
        <p className="text-muted-foreground">Cartão centralizado, grupos ordenados e largura limitada. No celular, uma coluna; em telas maiores, até duas por grupo.</p>
        <ol className="list-decimal pl-5 space-y-1">{plan.layout.groups.map(group=><li key={group.id}>
          {group.label} — {group.fieldIndexes.length} campo(s), {group.columns} coluna(s) em telas maiores
        </li>)}</ol>
        <p className="text-xs text-muted-foreground">Orientação de composição, não aprovação de novos contratos, ações ou integrações.</p>
      </div>
      <ul className="list-disc pl-5 text-sm space-y-1">
        {plan.coverage.map(item=><li key={item.id}><strong>{item.id}:</strong> {item.detail}</li>)}
      </ul>
      {plan.blockers.length>0&&<div role="alert" className="rounded-md border p-3 text-sm">
        <strong>Antes da geração:</strong><ul className="list-disc pl-5">{plan.blockers.map(item=><li key={item}>{item}</li>)}</ul>
      </div>}
      <details><summary className="cursor-pointer text-sm font-medium">Avisos e limites de execução</summary>
        <ul className="mt-2 list-disc pl-5 text-sm">{plan.warnings.map(item=><li key={item}>{item}</li>)}</ul>
      </details>
      <div className="flex flex-wrap gap-2">
        <button type="button" className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50"
          disabled={blocked} onClick={()=>setShowPreview(true)}>Gerar prévia JSON</button>
        <button type="button" className="rounded-md border px-4 py-2 text-sm" onClick={()=>copy("requirements")}>Copiar requisitos</button>
        {preview&&<button type="button" className="rounded-md border px-4 py-2 text-sm" onClick={()=>copy("screen")}>Copiar tela JSON</button>}
      </div>
    </div>
    {preview&&<div className="rounded-lg border bg-card p-4 space-y-3" data-testid="generated-preview">
      <h2 className="text-lg font-semibold">Prévia do catálogo aprovado</h2>
      <p className="text-sm text-muted-foreground">Demonstração sem persistência. Validação funcional e acessibilidade ainda exigem execução de testes.</p>
      <SpecScreen spec={preview}/>
      {trace&&<details data-testid="requirements-traceability" className="rounded-md border p-3 text-sm">
        <summary className="cursor-pointer font-medium">Rastreabilidade dos requisitos (somente verificação estática)</summary>
        <p className="mt-2 text-muted-foreground">Estado da spec: {trace.structurallyValid?"estrutura válida":"estrutura inconsistente"}. Testes de execução: não comprovados por este relatório.</p>
        <ul className="mt-2 list-disc space-y-2 pl-5">{trace.requirements.map(item=><li key={item.id}>
          <strong>{item.id}</strong>: {item.status} — {item.explanation}
          <span className="block text-muted-foreground">Origem: {item.origin}; nós: {item.nodeIds.join(", ")||"nenhum"}</span>
        </li>)}</ul>
      </details>}
      {localCandidate&&<SpecScreen spec={{root:"form",elements:{form:{type:"DeclarativeFormFlow",props:localCandidate,children:[]}}}}/>}
      <p className="text-xs text-muted-foreground">O formulário funcional usa o contrato Pi local já admitido, sem persistência nem chamadas externas. O perfil de layout não altera essa autorização.</p>
    </div>}
  </section>;
}
