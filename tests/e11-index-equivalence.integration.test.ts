import test from "node:test"
import assert from "node:assert/strict"
import groups from "../src/ui-catalog/reui-guidance.json"
import guides from "../src/ui-catalog/reui-example-guidance.pt-BR.json"
import {buildReuiExampleIndex,filterIndexedReuiExamples,filterReuiExamples} from "../src/ui-runtime/reui-search"
import {buildDiscoveryIndex,discoverContracts,discoverIndexedContracts,type DiscoveryEntry} from "../src/ui-runtime/catalog-discovery"

test("E11: full 559-example index preserves identifiers, ordering and multi-field semantics",()=>{
 const byFamily=groups as unknown as Record<string,{examples:[string,string][]}>
 const guidance=guides as Record<string,{bestFor:string;whenNotUse:string[]}>
 let total=0
 for(const [family,group] of Object.entries(byFamily)){
  const index=buildReuiExampleIndex(group.examples,family,guidance)
  total+=index.length
  for(const query of ["","não","FORMULÁRIO","c-","perguntas",family,"nenhum-nonsense"]){
   assert.deepEqual(
    filterIndexedReuiExamples(index,query),
    filterReuiExamples(group.examples,family,query,guidance),
    family+": "+query,
   )
  }
 }
 assert.equal(total,559)
})
test("E11: semantic catalog index keeps provenance, filters and rejection semantics",()=>{
 const entries:DiscoveryEntry[]=[
  {name:"Dialog",description:"Editar conteúdo",purpose:"Formulários locais",whenUse:["Confirmar revisão"],maturity:"stable",piAvailable:true},
  {name:"AlertDialog",description:"Aviso irreversível",purpose:"Confirmação",whenUse:["Confirmar destruição"],maturity:"beta",piAvailable:false},
  {name:"PreviewCandidate",description:"Exemplo experimental",whenUse:[],maturity:"experimental",piAvailable:false},
 ]
 const index=buildDiscoveryIndex(entries)
 for(const query of ["","confirmar","confirmacao","FORMULÁRIOS","irreversível","remoto","preview"]){
  for(const pi of ["all","available","unavailable"]){
   for(const group of ["all","Confirmação e feedback","Formulários e entrada"]){
    const options={query,pi,group}
    assert.deepEqual(discoverIndexedContracts(index,options),discoverContracts(entries,options))
   }
  }
 }
 assert.equal(index[0].entry,entries[0])
})
