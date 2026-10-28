import {catalog} from "../src/ui-catalog/catalog";
import {resolvePattern,generatePatternPreview} from "../src/ui-requirements/patterns";
import {tracePattern} from "../src/ui-requirements/traceability";
import {evaluateLayoutQuality} from "../src/ui-requirements/layout-quality";
import {improveLayoutQuality} from "../src/ui-requirements/layout-repair";
const variants=[
 ["login",{}],["login",{identifier:"username"}],["login",{remember:true}],
 ["search",{}],["search",{dateFilter:true}],["search",{selection:true,pageSize:"10"}],
 ["list",{}],["list",{compact:true}],["list",{title:"Clientes"}],
 ["dashboard",{}],["dashboard",{view:"graphs"}],["dashboard",{density:"2"}],
] as const;
const details=[];let mismatches=0;
for(const [flow,answers] of variants){
 const requirements=resolvePattern(flow,answers);
 const screen=generatePatternPreview(requirements);
 const parsed=catalog.validate(screen);
 const trace=tracePattern(requirements,screen);
 const correct=parsed.success&&trace.structurallyValid&&trace.requirements.every(x=>x.status!=="blocked");
 if(!correct)mismatches++;
 const refinement=improveLayoutQuality(requirements,screen);
 details.push({flow,answers,correct,requirements:trace.requirements,issues:trace.issues,
  layoutQuality:evaluateLayoutQuality(requirements,screen),
  layoutImprovement:{status:refinement.status,reason:refinement.reason,
   initialScore:refinement.before?.score??null,finalScore:refinement.after?.score??null,
   edits:refinement.edits}});
}
console.log(JSON.stringify({schemaVersion:1,scenarios:details.length,staticallyValid:details.length-mismatches,mismatches,
 runtimeTests:"not-executed",disclaimer:"Catalog conformity is separate from advisory static layout quality. No pixel-based or browser visual certification, authentication, backend or real interaction is inferred.",
 details},null,2));
if(mismatches)process.exitCode=1;
