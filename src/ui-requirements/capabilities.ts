import alertDialog from "../ui-catalog/knowledge/alert-dialog.json";
import input from "../ui-catalog/knowledge/input.json";
import select from "../ui-catalog/knowledge/select.json";
import button from "../ui-catalog/knowledge/button.json";
import dataTable from "../ui-catalog/knowledge/data-table.json";
import lock from "../ui-catalog/contracts.lock.json";

export type CapabilityState="implemented-static-evidence"|"documented-not-implemented"|"runtime-review-required";
type Doc=typeof input;
const documents=[alertDialog,input,select,button,dataTable] as unknown as Doc[];
const approved=new Set(lock.components.filter(c=>c.status==="approved").map(c=>c.name));
export const capabilityIndex=documents.flatMap(doc=>doc.capabilities.map(cap=>({
  component:doc.component,id:cap.id,state:cap.state as CapabilityState,
  description:cap.description,source:`src/ui-catalog/knowledge/${doc.component.replace(/([a-z0-9])([A-Z])/g,"$1-$2").toLowerCase()}.json`,
  approvedContract:approved.has(doc.component),
  evidence:cap.evidence.map(e=>e.path),
})));
export function findCapabilities(search:string){
  const term=search.toLocaleLowerCase("pt-BR").trim();
  return capabilityIndex.filter(c=>(c.id+" "+c.description+" "+c.component).toLocaleLowerCase("pt-BR").includes(term));
}
export function capabilityAvailable(component:string,id:string):boolean {
  return capabilityIndex.some(x=>x.component===component && x.id===id && x.approvedContract && x.state==="implemented-static-evidence");
}
export function isApprovedContract(name:string):boolean{return approved.has(name);}
