import {catalog,stableComponentDefinitions,stableComponentEventDescriptors,actionDefinitions} from "../ui-catalog/catalog";
import {graphErrors} from "../../scripts/lib/spec-invariants.mjs";
import {planInterface,type CompositionPlan,type RequirementCoverage} from "./planner";
import {generateRegistrationScreen} from "./generator";
import type {RequirementSpec} from "./schema";

export type Compliance={valid:boolean;issues:string[];requirements:RequirementCoverage[];tests:{id:string;status:"not-executed"}[]};
export function verifyInterface(requirements:RequirementSpec,generated:unknown):Compliance {
  const plan=planInterface(requirements);
  const validation=catalog.validate(generated);
  const errors=graphErrors(generated,Object.keys(stableComponentDefinitions),{
    allowedActions:Object.keys(actionDefinitions),allowedEvents:stableComponentEventDescriptors
  });
  const issues=[...plan.blockers,...(validation.success?[]:["Zod: contrato rejeitou a spec"]),...errors];
  if(validation.success){
    const nodes=Object.values((generated as {elements:Record<string,{type:string}>}).elements);
    if(nodes.filter(n=>n.type==="Input").length!==requirements.fields.length)issues.push("Quantidade de campos divergente");
    if(requirements.answers.confirmation===true&&!nodes.some(n=>n.type==="AlertDialog"))issues.push("Confirmação ausente");
  }
  return {valid:issues.length===0,issues,requirements:plan.coverage,tests:plan.tests.map(x=>({id:x.id,status:x.status}))};
}
export function prepareInterface(requirements:RequirementSpec):{plan:CompositionPlan;screen:unknown|null;compliance:Compliance|null}{
  const plan=planInterface(requirements);
  if(plan.blockers.length)return {plan,screen:null,compliance:null};
  const screen=generateRegistrationScreen(requirements);
  return {plan,screen,compliance:verifyInterface(requirements,screen)};
}
