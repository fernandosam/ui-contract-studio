import {createHash} from "node:crypto";
import stableLock from "../ui-catalog/contracts.lock.json";
import {resolveAnswers} from "./engine";
import {planInterface} from "./planner";
import {generateRegistrationScreen} from "./generator";
import {traceRegistration,tracePattern} from "./traceability";
import {resolvePattern,generatePatternPreview} from "./patterns";
import {catalog} from "../ui-catalog/catalog";

const families={
 registration:{sources:["src/ui-requirements/flows/registration.json","src/ui-requirements/generator.ts",
  "src/ui-requirements/form-proposal.ts"],components:["Input","Button","AlertDialog","Grid","Stack","Card"]},
 login:{sources:["src/ui-requirements/pattern-flows.json","src/ui-requirements/patterns.ts"],components:["Input","Button","Checkbox","Stack","Card"]},
 search:{sources:["src/ui-patterns/search-and-filters.json","src/ui-requirements/pattern-flows.json",
  "src/ui-requirements/patterns.ts"],components:["DataTable","DatePicker","Stack"]},
 list:{sources:["src/ui-patterns/crud-list.json","src/ui-requirements/pattern-flows.json",
  "src/ui-requirements/patterns.ts"],components:["Table","Card"]},
 dashboard:{sources:["src/ui-patterns/dashboard-kpis.json","src/ui-patterns/dashboard-analytics.json",
  "src/ui-requirements/pattern-flows.json","src/ui-requirements/patterns.ts"],components:["Metric","BarGraph","LineGraph","Grid"]},
} as const;
type Family=keyof typeof families;
const allFamilies=Object.keys(families) as Family[];
const sharedSources=[
 "src/ui-catalog/contracts.lock.json","pi-catalog/contracts.json",
 "src/ui-requirements/schema.ts","src/ui-requirements/traceability.ts",
 "src/ui-catalog/catalog.ts","src/ui-catalog/extensions/catalog.ts",
];
function normalized(path:string){
 return path.replaceAll("\\","/").replace(/^\.\//,"");
}
export type ImpactEntry={family:Family;changed:string[];components:string[];requiredChecks:string[];advice:string};
export function assessChangeImpact(paths:readonly string[]){
 const changed=[...new Set(paths.map(normalized).filter(Boolean))].sort();
 const invalid=changed.filter(x=>x.startsWith("/")||x.split("/").includes(".."));
 if(invalid.length)throw Error("Caminho inválido: "+invalid.join(", "));
 const impacts:ImpactEntry[]=[];
 const recognized=new Set<string>();
 for(const family of allFamilies){
  const references=families[family];
  const pathsForFamily=changed.filter(path=>{
   const global=sharedSources.includes(path) || path==="src/ui-requirements/composition-rules.json";
   const local=references.sources.some(file=>file===path);
   const knowledge=references.components.some(component=>
    path==="src/ui-catalog/knowledge/"+component.replace(/([a-z0-9])([A-Z])/g,"$1-$2").toLowerCase()+".json");
   const generator=family==="registration"&&path==="src/ui-requirements/planner.ts";
   return global||local||knowledge||generator;
  });
  pathsForFamily.forEach(path=>recognized.add(path));
  if(!pathsForFamily.length)continue;
  impacts.push({family,changed:pathsForFamily,components:[...references.components],
   requiredChecks:["contracts:check","requirements:test","requirements:audit","requirements:patterns:audit",
    "typecheck","browser-review"],
   advice:pathsForFamily.some(x=>x.includes("contracts")||x.includes("catalog"))
    ?"Revisar compatibilidade da API, lock, possíveis migrações e admissão Pi antes da publicação."
    :"Revalidar variantes e requisitos atingidos; comparar propriedades e evidências E2E independentes."});
 }
 return {schemaVersion:1 as const,changed,impacts,unmapped:changed.filter(x=>!recognized.has(x)),
  warning:"Análise conservadora e estática: nenhuma execução E2E é inferida."};
}
const patternCases=[
 ["login",{}],["login",{identifier:"username"}],["login",{remember:true}],
 ["search",{}],["search",{dateFilter:true}],["search",{selection:true,pageSize:"10"}],
 ["list",{}],["list",{compact:true}],["list",{title:"Clientes"}],
 ["dashboard",{}],["dashboard",{view:"graphs"}],["dashboard",{density:"2"}]
] as const;
export function measureStaticCoverage(registrationCases:readonly {id:string;answers:Record<string,string|boolean|string[]>;blocked:boolean}[]){
 let eligible=0,firstPassValid=0,expectedBlocked=0,unapprovedComponents=0;
 const samples:{id:string;family:string;valid:boolean;fingerprint:string;requirements:number;runtimeEvidence:"not-executed"}[]=[];
 const approved=new Set(stableLock.components.filter(c=>c.status==="approved").map(c=>c.name));
 const sha=(x:unknown)=>createHash("sha256").update(JSON.stringify(x)).digest("hex");
 function capture(id:string,family:string,requirements:number,screen:{root:string;elements:Record<string,{type:string}>},valid:boolean){
  eligible++;
  if(valid)firstPassValid++;
  unapprovedComponents+=Object.values(screen.elements).filter(x=>!approved.has(x.type)).length;
  samples.push({id,family,valid,fingerprint:sha({family,screen,lock:stableLock.schemaVersion}),requirements,runtimeEvidence:"not-executed"});
 }
 for(const scenario of registrationCases){
  const req=resolveAnswers(scenario.answers);
  const plan=planInterface(req);
  if(plan.blockers.length){
   if(!scenario.blocked)throw Error("Unexpected registration blocker: "+scenario.id);
   expectedBlocked++;
   continue;
  }
  if(scenario.blocked)throw Error("Expected blocker missing: "+scenario.id);
  const screen=generateRegistrationScreen(req);
  const trace=traceRegistration(req,screen);
  capture(scenario.id,"registration",trace.requirements.length,screen,
   catalog.validate(screen).success&&trace.structurallyValid);
 }
 for(const [flow,answers] of patternCases){
  const req=resolvePattern(flow,answers);
  const screen=generatePatternPreview(req);
  const trace=tracePattern(req,screen);
  capture(flow+":"+JSON.stringify(answers),flow,trace.requirements.length,screen,
   catalog.validate(screen).success&&trace.structurallyValid);
 }
 return {schemaVersion:1 as const,eligible,firstPassValid,firstPassRate:eligible?firstPassValid/eligible:0,
  expectedBlocked,unapprovedComponents,newContractsNeededForAcceptedSpecs:unapprovedComponents,
  runtimeTests:"not-executed" as const,limit:"Não demonstra execução real, acessibilidade ou persistência.",
  samples};
}
