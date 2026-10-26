import { test } from "node:test"
import assert from "node:assert/strict"
import { extensionDefinitions } from "../src/ui-catalog/extensions/catalog"
import { catalog } from "../src/ui-catalog/catalog"
import { readFileSync } from "node:fs"

const read=(path:string)=>JSON.parse(readFileSync(path,"utf8"))
const schema=extensionDefinitions.OnboardingChecklist.props
const valid=read("pi-catalog/examples/OnboardingChecklist.json")
const props=valid.elements[valid.root].props as { steps: Array<{ id:string;title:string;description:string;status:string }>; defaultOpenId:string }

test("OnboardingChecklist: valores semânticos válidos e fixture JSON são aceitos",()=>{
 assert.equal(schema.safeParse(props).success,true)
 assert.equal(catalog.validate(valid).success,true)
 const changed=structuredClone(valid)
 changed.elements[changed.root].props.steps[0].title="Primeira etapa personalizada"
 assert.equal(catalog.validate(changed).success,true)
})

test("OnboardingChecklist: rejects duplicate IDs, bogus initial ID, and multiple active steps",()=>{
 const invalid=[
  {...props,steps:[props.steps[0],props.steps[0]]},
  {...props,defaultOpenId:"missing"},
  {...props,steps:props.steps.map(s=>({...s,status:"active"}))},
  {...props,steps:[]},
  {...props,steps:Array.from({length:13},(_,i)=>({...props.steps[0],id:"step-"+i}))},
  {...props,steps:[{...props.steps[0],title:""}]},
  {...props,steps:[{...props.steps[0],status:"finished"}]},
  {...props,steps:[{...props.steps[0],id:"invalid id"}]},
  {...props,children:"arbitrary JSX"},
  {...props,className:"text-red-500"},
  {...props,onClick:"window.location"},
  {...props,html:"<script>alert(1)</script>"},
 ]
 for(const candidate of invalid){
   const parsed=schema.safeParse(candidate)
   assert.equal(parsed.success,false,JSON.stringify(candidate))
   const spec=structuredClone(valid)
   spec.elements[spec.root].props=candidate
   assert.equal(catalog.validate(spec).success,false,"catalog accepted invalid semantic props")
 }
})

test("OnboardingChecklist: Pi provides semantic recommendations separately from executable props",()=>{
 const api=read("pi-catalog/contracts.json")
 const entry=api.components.find((v:{type:string})=>v.type==="OnboardingChecklist")
 assert.equal(entry.semanticGuidance.referenceExamples[0],"c-accordion-11")
 assert.ok(entry.semanticGuidance.whenUse.length>0)
 assert.ok(entry.semanticGuidance.whenNotUse.length>0)
 assert.ok(entry.semanticGuidance.agentNotes.length>0)
 assert.ok(!("semanticGuidance" in props))
})
