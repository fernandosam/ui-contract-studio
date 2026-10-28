import {readFileSync,readdirSync} from "node:fs";
import {resolve} from "node:path";

// Reviewed browser recipes are executable assertions, not a code generator.
// A new semantic case opts in by naming an existing recipe. The remaining
// prose requirements are visible as pending; they are never silently "passed".
export const semanticTestRecipes=Object.freeze({
  "dialog.cancel-without-confirm":Object.freeze({
    component:"AlertDialog",kind:"integration",
    capabilities:["explicit-cancel","confirm-signal"],coverage:"partial",
  }),
  "button.press-disabled":Object.freeze({
    component:"Button",kind:"integration",
    capabilities:["local-press-event","loading-and-disabled"],coverage:"partial",
  }),
  "accordion.single-multiple":Object.freeze({
    component:"Accordion",kind:"integration",
    capabilities:["single-multiple-expansion"],coverage:"full",
  }),
});

export function loadSemanticTestRecords(root=process.cwd()) {
  const folder=resolve(root,"src/ui-catalog/knowledge");
  return readdirSync(folder).filter(name=>name.endsWith(".json")).sort()
    .map(name=>{
      const source="src/ui-catalog/knowledge/"+name;
      return {...JSON.parse(readFileSync(resolve(root,source),"utf8")),curatedSource:source};
    });
}

/** Inventory is never proof of runtime success or authority to extend Pi. */
export function buildSemanticTestAutomation(profiles) {
  const errors=[],entries=[];
  const seen=new Set();
  for(const profile of profiles.filter(p=>p.curatedSource)) {
    const capabilities=new Map((profile.capabilities??[]).map(cap=>[cap.id,cap]));
    for(const scenario of profile.derivedTestCases??[]) {
      const key=profile.component+"/"+scenario.id;
      const selected=scenario.automation;
      const states=(scenario.capabilities??[]).map(id=>({
        id,state:capabilities.get(id)?.state??"unknown",
      }));
      const entry={
        component:profile.component,id:scenario.id,kind:scenario.kind,
        source:profile.curatedSource,capabilities:scenario.capabilities,
        capabilityStates:states,recipe:selected?.recipe??null,
        runner:selected?.runner??null,coverage:null,
        status:"pending-recipe",execution:"not-run",
      };
      const issue=message=>{errors.push(key+": "+message);entry.status="invalid";};
      if(seen.has(key))issue("duplicate derived test ID");
      seen.add(key);
      if(scenario.kind==="candidate-not-executable" ||
         states.some(cap=>cap.state==="documented-not-implemented")) {
        entry.status="blocked-not-implemented";
        if(selected!==undefined)issue("unimplemented/candidate behavior cannot register a runnable recipe");
      } else if(selected!==undefined) {
        if(!selected || typeof selected!=="object" || Array.isArray(selected) ||
           Object.keys(selected).some(name=>!["runner","recipe"].includes(name)) ||
           selected.runner!=="playwright" || typeof selected.recipe!=="string") {
          issue("automation must specify a reviewed Playwright recipe");
        } else {
          const recipe=semanticTestRecipes[selected.recipe];
          if(!recipe)issue("unknown executable recipe "+selected.recipe);
          else if(recipe.component!==profile.component || recipe.kind!==scenario.kind)
            issue("recipe component/kind mismatch");
          else if(!recipe.capabilities.every(id=>(scenario.capabilities??[]).includes(id)))
            issue("recipe does not cover its declared capability prerequisites");
          else if(states.some(cap=>cap.state==="unknown"))
            issue("unknown capability referenced by runnable test");
          else {
            entry.status="registered";
            entry.coverage=recipe.coverage;
          }
        }
      }
      entries.push(entry);
    }
  }
  entries.sort((a,b)=>a.component.localeCompare(b.component)||a.id.localeCompare(b.id));
  return {
    schemaVersion:1,
    disclaimer:"Registration is not execution evidence, full a11y verification, Zod support or Pi admission.",
    summary:{
      total:entries.length,
      registered:entries.filter(x=>x.status==="registered").length,
      partial:entries.filter(x=>x.status==="registered"&&x.coverage==="partial").length,
      pending:entries.filter(x=>x.status==="pending-recipe").length,
      blocked:entries.filter(x=>x.status==="blocked-not-implemented").length,
      invalid:entries.filter(x=>x.status==="invalid").length,
    },
    entries,errors,
  };
}
