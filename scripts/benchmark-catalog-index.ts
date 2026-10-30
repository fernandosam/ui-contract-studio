import {performance} from "node:perf_hooks"
import groups from "../src/ui-catalog/reui-guidance.json"
import guides from "../src/ui-catalog/reui-example-guidance.pt-BR.json"
import pi from "../pi-catalog/contracts.json"
import {buildReuiExampleIndex,filterIndexedReuiExamples,filterReuiExamples} from "../src/ui-runtime/reui-search"
import {buildDiscoveryIndex,discoverContracts,discoverIndexedContracts,type DiscoveryEntry} from "../src/ui-runtime/catalog-discovery"

const reuiGuides=groups as Record<string,{examples:[string,string][]}>
const searchGuides=guides as Record<string,{bestFor:string;whenNotUse:string[]}>
const allExamples=Object.entries(reuiGuides).map(([family,guide])=>({family,items:guide.examples,index:buildReuiExampleIndex(guide.examples,family,searchGuides)}))
const entries:DiscoveryEntry[]=pi.components.map(item=>({
 name:item.type,description:"",purpose:"",whenUse:[],maturity:item.stability,piAvailable:item.lifecycle==="stable",
}))
const contractIndex=buildDiscoveryIndex(entries)
const queries=["","não","dialog","formulario","c-","dados","not-found"]
const iterations=250
const bench=(run:()=>void)=>{
 for(let i=0;i<25;i++)run()
 const start=performance.now()
 for(let i=0;i<iterations;i++)run()
 return Math.round((performance.now()-start)*100)/100
}
const reuiCold=bench(()=>{for(const group of allExamples)for(const query of queries)filterReuiExamples(group.items,group.family,query,searchGuides)})
const reuiWarm=bench(()=>{for(const group of allExamples)for(const query of queries)filterIndexedReuiExamples(group.index,query)})
const catalogCold=bench(()=>{for(const query of queries)discoverContracts(entries,{query})})
const catalogWarm=bench(()=>{for(const query of queries)discoverIndexedContracts(contractIndex,{query})})
console.log(JSON.stringify({
 dataset:{reuiFamilies:allExamples.length,reuiExamples:allExamples.reduce((n,g)=>n+g.items.length,0),contracts:entries.length},
 iterations,queries,
 milliseconds:{reuiCold,reuiWarm,catalogCold,catalogWarm},
 speedup:{reui:Math.round(reuiCold/reuiWarm*100)/100,catalog:Math.round(catalogCold/catalogWarm*100)/100},
 note:"Illustrative local CPU timings; build and network measurements are separate.",
},null,2))
