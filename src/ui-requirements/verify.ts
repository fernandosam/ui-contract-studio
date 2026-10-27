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
  if(validation.success && !plan.blockers.length){
    const actual=generated as {root:string;elements:Record<string,{type:string;props:Record<string,unknown>;children:string[]}>};
    const expected=generateRegistrationScreen(requirements);
    const same=(a:unknown,b:unknown)=>JSON.stringify(a)===JSON.stringify(b);
    const names=[...new Set(Object.values(actual.elements).map(n=>n.type))].sort();
    if(!same(names,[...plan.components].sort()))issues.push("Componentes divergem do plano");
    if(actual.root!==expected.root)issues.push("Raiz divergente");
    const keys=new Set([...Object.keys(actual.elements),...Object.keys(expected.elements)]);
    for(const key of keys){
      const a=actual.elements[key],b=expected.elements[key];
      if(!a||!b){issues.push("Nó divergente: "+key);continue;}
      if(a.type!==b.type||!same(a.props,b.props)||!same(a.children,b.children))
        issues.push("Requisito ou composição divergente: "+key);
      if("on" in a)issues.push("Ação não especificada: "+key);
    }
  }
  return {valid:issues.length===0,issues,requirements:plan.coverage,tests:plan.tests.map(x=>({id:x.id,status:x.status}))};
}
export function prepareInterface(requirements:RequirementSpec):{plan:CompositionPlan;screen:unknown|null;compliance:Compliance|null}{
  const plan=planInterface(requirements);
  if(plan.blockers.length)return {plan,screen:null,compliance:null};
  const screen=generateRegistrationScreen(requirements);
  return {plan,screen,compliance:verifyInterface(requirements,screen)};
}
