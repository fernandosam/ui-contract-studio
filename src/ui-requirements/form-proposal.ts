import {declarativeFormFlowSchema,type DeclarativeFormFlowProps} from "../ui-catalog/extensions/composites/proposals/DeclarativeFormFlow.schema";
import type {RequirementSpec} from "./schema";

/**
 * Converts user decisions into a strictly typed review-only form candidate.
 * This proposal is NOT an authorized Pi component and cannot persist anything.
 */
export function proposeFormFlow(spec:RequirementSpec):DeclarativeFormFlowProps{
 if(spec.flow!=="registration"||spec.missing.length||spec.answers.persistence!=="local-demo")
  throw Error("Proposta bloqueada: requisitos ou persistência não autorizados");
 if(spec.answers.validation==="business")
  throw Error("Proposta bloqueada: regras de negócio não implementadas");
 const proposed={
  title:"Cadastro de usuários",
  description:"Prévia local sem gravação ou envio de dados.",
  fields:spec.fields.map(field=>({
   name:field.name,label:field.label,type:field.type,required:field.required
  })),
  layout:spec.answers.layout,
  validation:spec.answers.validation==="none"?"none":"on-submit",
  submitLabel:"Concluir demonstração",
  confirmation:spec.answers.confirmation===true?{
   title:"Confirmar cadastro",
   description:String(spec.answers.confirmationMessage||"Confirma os dados?"),
   confirmLabel:"Confirmar simulação"
  }:null,
 };
 return declarativeFormFlowSchema.parse(proposed);
}
