import {existsSync, readFileSync} from "node:fs";
import {resolve} from "node:path";

const read = (root,path) => {
  const file=resolve(root,path);
  return existsSync(file) ? JSON.parse(readFileSync(file,"utf8")) : null;
};
const byName = items => new Map((items??[]).map(item=>[item.name??item.type,item]));
const bindingKinds = new Set(["prop","event"]);
const dispositions = new Set([
  "retain-primitive","evolve-primitive","reuse-composition",
  "propose-composition","out-of-scope",
]);
const sort = (a,b) => a.localeCompare(b);

/**
 * T31: compare curated knowledge, verified source evidence and the published
 * Zod/Pi surface. Diagnostic-only: this audit cannot edit schemas, approvals,
 * permissions or implementation state.
 *
 * All capability states are reported, even when the schema is unavailable.
 * Explicit contractBindings alone claim a public surface and are fail-closed.
 */
export function auditSemanticContractConformance({
  root=process.cwd(),profiles=[],capabilityAudit={entries:[]},
}={}) {
  const lock=read(root,"src/ui-catalog/contracts.lock.json");
  const pi=read(root,"pi-catalog/contracts.json");
  const schemas=read(root,"pi-catalog/props-json-schema.json");
  const locked=byName(lock?.components);
  const published=byName(pi?.components);
  const audited=new Map((capabilityAudit.entries??[]).map(item=>[
    item.component+"#"+item.capability,item,
  ]));
  const errors=[],diagnostics=[],entries=[],components=[];
  for(const profile of [...profiles].filter(p=>p.curatedSource)
    .sort((a,b)=>sort(a.component,b.component))) {
    const name=profile.component,record=locked.get(name),publishedEntry=published.get(name);
    const approved=record?.status==="approved";
    const piAvailable=Boolean(pi && publishedEntry && publishedEntry.lifecycle==="stable");
    let contractStatus=approved && piAvailable ? "approved" :
      approved && !pi ? "manifest-unavailable" :
      !approved && !publishedEntry ? "candidate-not-admitted" : "contract-mismatch";
    if(pi && (approved!==Boolean(publishedEntry) ||
      (approved && (record?.version!==publishedEntry?.version ||
        publishedEntry?.lifecycle!=="stable")))) {
      contractStatus="contract-mismatch";
      errors.push(name+": contract lock / Pi manifest mismatch; review and synchronize independently");
    }
    if(schemas && pi && schemas.projectVersion!==pi.projectVersion) {
      errors.push(name+": generated Zod schema version differs from Pi manifest");
    }
    if(approved && piAvailable && schemas && !schemas.types?.[name]) {
      errors.push(name+": approved Pi type is missing from the generated Zod schemas");
    }
    const start=entries.length;
    for(const cap of [...(profile.capabilities??[])].sort((a,b)=>sort(a.id,b.id))) {
      const implementation=audited.get(name+"#"+cap.id);
      const availability=implementation?.availability??"missing-record";
      const declaredBindings=Array.isArray(cap.contractBindings)?cap.contractBindings:[];
      const bindings=[];
      for(const binding of declaredBindings) {
        const label=binding.kind+":"+binding.name;
        let status="verified-schema";
        if(!approved || !piAvailable || availability!=="verified-static") {
          status="unauthorized-binding";
        } else if(!schemas?.types?.[name]) {
          status="schema-unavailable";
        } else if(binding.kind==="prop" &&
          !Object.hasOwn(schemas.types[name].properties??{},binding.name) ||
          binding.kind==="event" &&
          !(schemas.events?.[name]??[]).includes(binding.name)) {
          status="not-in-zod-schema";
        } else if(!(cap.evidence??[]).some(ref=>
          typeof ref.path==="string" && /\\.(?:tsx|jsx)$/.test(ref.path) &&
          typeof ref.contains==="string" && ref.contains.includes(binding.name))) {
          status="implementation-binding-unverified";
        }
        bindings.push({kind:binding.kind,name:binding.name,status});
        if(["unauthorized-binding","not-in-zod-schema",
          "implementation-binding-unverified"].includes(status)) {
          errors.push(name+"#"+cap.id+": "+label+" "+status+
            "; guidance cannot grant props/events");
        } else if(status==="schema-unavailable") {
          diagnostics.push({component:name,capability:cap.id,status,
            action:"Regenerate the real Zod schema before accepting this binding."});
        }
      }
      const decision=cap.decision??null;
      if(availability==="not-implemented" && !decision) {
        diagnostics.push({component:name,capability:cap.id,status:"decision-required",
          action:"Review primitive evolution, approved composition or explicit exclusion."});
      }
      if(availability==="runtime-review-required") {
        diagnostics.push({component:name,capability:cap.id,status:"runtime-review-required",
          action:"Run the derived browser/a11y tests; static evidence is not certification."});
      }
      if(availability==="missing-evidence" || availability==="missing-record") {
        const issue=name+"#"+cap.id+": missing or insufficient implementation evidence";
        if(profile.documentationReview==="reviewed-documentation" &&
          cap.state==="implemented-static-evidence") errors.push(issue);
        else diagnostics.push({component:name,capability:cap.id,
          status:"documentation-review-required",action:issue});
      }
      entries.push({
        component:name,capability:cap.id,source:profile.curatedSource,
        documentationReview:profile.documentationReview,
        availability,contractStatus,
        bindings,
        decision:decision ? {disposition:decision.disposition,
          reason:decision.reason,target:decision.target??null} : null,
        evidencePaths:(cap.evidence??[]).map(x=>x.path),
        testRequirements:cap.testRequirements??[],
        authority:"advisory-only",
      });
    }
    const rows=entries.slice(start);
    components.push({component:name,source:profile.curatedSource,contractStatus,
      contractVersion:record?.version??null,
      capabilities:rows.length,
      verifiedStatic:rows.filter(x=>x.availability==="verified-static").length,
      schemaBound:rows.filter(x=>x.bindings.some(b=>b.status==="verified-schema")).length,
      notImplemented:rows.filter(x=>x.availability==="not-implemented").length,
      runtimeReview:rows.filter(x=>x.availability==="runtime-review-required").length,
      decisionsPending:rows.filter(x=>x.availability==="not-implemented"&&!x.decision).length,
    });
  }
  return {
    schemaVersion:1,
    authority:"audit-only",
    disclaimer:"Documentation and static evidence cannot authorize Pi types, Zod props, events, remote actions or permissions. Browser tests and human admission remain independent.",
    inputs:[
      "src/ui-catalog/knowledge/","src/ui-catalog/contracts.lock.json",
      "pi-catalog/contracts.json","pi-catalog/props-json-schema.json",
    ],
    summary:{components:components.length,capabilities:entries.length,
      verifiedStatic:entries.filter(x=>x.availability==="verified-static").length,
      schemaBound:entries.filter(x=>x.bindings.some(b=>b.status==="verified-schema")).length,
      notImplemented:entries.filter(x=>x.availability==="not-implemented").length,
      runtimeReview:entries.filter(x=>x.availability==="runtime-review-required").length,
      decisionsPending:components.reduce((n,x)=>n+x.decisionsPending,0),
      blockingErrors:errors.length},
    components,entries,diagnostics,errors:[...new Set(errors)].sort(sort),
  };
}

export function validateSemanticContractDecision(cap) {
  const errors=[];
  if(cap.contractBindings!==undefined) {
    if(!Array.isArray(cap.contractBindings) ||
      !cap.contractBindings.length) errors.push("contractBindings must be a nonempty array");
    const seen=new Set();
    for(const item of Array.isArray(cap.contractBindings)?cap.contractBindings:[]) {
      if(!bindingKinds.has(item?.kind) ||
        typeof item.name!=="string" ||
        !/^[A-Za-z][A-Za-z0-9]*$/.test(item.name) ||
        seen.has(item.kind+":"+item.name)) errors.push("invalid/duplicate contract binding");
      seen.add(item?.kind+":"+item?.name);
    }
    if(cap.state!=="implemented-static-evidence")
      errors.push("only verified implementation candidates can declare contractBindings");
  }
  if(cap.decision!==undefined) {
    const d=cap.decision;
    if(!dispositions.has(d?.disposition) ||
      typeof d?.reason!=="string" || !d.reason.trim())
      errors.push("invalid reviewed capability decision");
    if(["reuse-composition","propose-composition"].includes(d?.disposition) &&
      (typeof d.target!=="string" || !/^[A-Z][A-Za-z0-9]+$/.test(d.target)))
      errors.push("composition decision needs a named target");
  }
  return errors;
}
