import {readFileSync,readdirSync} from "node:fs";
import {resolve} from "node:path";

// Reviewed browser recipes are executable assertions, not a code generator.
// A new semantic case opts in by naming an existing recipe. The remaining
// prose requirements are visible as pending; they are never silently "passed".
export const semanticTestRecipes=Object.freeze({
  "checkbox.toggle-local":Object.freeze({
    component:"Checkbox",kind:"integration",
    capabilities:["controlled-boolean-initialization","local-checked-change"],coverage:"partial",
  }),
  "checkbox.label-help":Object.freeze({
    component:"Checkbox",kind:"integration",
    capabilities:["label-description-association"],coverage:"partial",
  }),
  "checkbox.disabled-invalid":Object.freeze({
    component:"Checkbox",kind:"integration",
    capabilities:["name-required-disabled-forwarding","invalid-aria-visual"],coverage:"partial",
  }),
  "input.change-enter":Object.freeze({
    component:"Input",kind:"integration",
    capabilities:["local-value-binding-and-change","focus-blur-and-enter-signal"],coverage:"partial",
  }),
  "input.label-help":Object.freeze({
    component:"Input",kind:"integration",
    capabilities:["label-name-and-help"],coverage:"partial",
  }),
  "input.native-states":Object.freeze({
    component:"Input",kind:"integration",
    capabilities:["native-state-and-length","required-check-forwarding","invalid-aria-state"],coverage:"partial",
  }),
  "select.simple-object-options":Object.freeze({
    component:"Select",kind:"integration",
    capabilities:["single-select-text-options","placeholder-value-slot","value-defaultvalue-and-change"],coverage:"partial",
  }),
  "select.disabled-options":Object.freeze({
    component:"Select",kind:"integration",
    capabilities:["disabled-field-and-options","value-defaultvalue-and-change"],coverage:"partial",
  }),
  "dialog.trigger-content":Object.freeze({
    component:"Dialog",kind:"integration",
    capabilities:["automatic-trigger","title-description-and-children"],coverage:"partial",
  }),
  "dialog.escape-close":Object.freeze({
    component:"Dialog",kind:"integration",
    capabilities:["escape-and-backdrop-dismissal","controlled-open-and-event","overlay-and-close-control"],coverage:"partial",
  }),
  "tabs.select-panel":Object.freeze({
    component:"Tabs",kind:"integration",
    capabilities:["selected-value-and-default","text-tab-panels"],coverage:"partial",
  }),
  "tabs.disabled":Object.freeze({
    component:"Tabs",kind:"integration",
    capabilities:["disabled-set-and-items"],coverage:"partial",
  }),

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
        action:"implement-reviewed-recipe-and-run-browser",
      };
      const issue=message=>{errors.push(key+": "+message);entry.status="invalid";};
      if(seen.has(key))issue("duplicate derived test ID");
      seen.add(key);
      if(scenario.kind==="candidate-not-executable" ||
         states.some(cap=>cap.state==="documented-not-implemented")) {
        entry.status="blocked-not-implemented";
        entry.action="review-implementation-before-automation";
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
            entry.action="run-registered-playwright-recipe";
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
