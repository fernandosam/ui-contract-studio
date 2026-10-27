import {readFileSync, realpathSync, statSync} from "node:fs";
import {resolve, sep} from "node:path";

/**
 * Repository-local evidence audit. The states mirror the recommendation engine's
 * availability vocabulary, not the contract lock or Pi admission decisions.
 */
const availabilityValues = [
  "verified-static", "not-implemented", "missing-evidence",
  "runtime-review-required", "missing-record",
];
const inside = (parent, file) => file.startsWith(parent + sep);
const validReference = value => typeof value === "string" &&
  /^src\/[a-zA-Z0-9_./-]+$/.test(value) && !value.split("/").includes("..");

export function inspectCodeEvidence(source, {root = process.cwd()} = {}) {
  const path = source?.path ?? null;
  const contains = source?.contains ?? null;
  const item = {path, contains, status:"unsafe-reference"};
  if (!validReference(path) || typeof contains !== "string" ||
      !contains.trim() || contains.length > 500) return item;
  const absolute = resolve(root,path);
  const base = resolve(root);
  if (!inside(base,absolute)) return item;
  try {
    const actualRoot = realpathSync(base);
    const actualFile = realpathSync(absolute);
    if (!inside(actualRoot,actualFile) || !statSync(actualFile).isFile())
      return item;
    return {...item, status:readFileSync(actualFile,"utf8").includes(contains)
      ? "matched" : "missing-fragment"};
  } catch {
    return {...item,status:"missing-file"};
  }
}

/** A claim of implementation needs reviewed metadata AND every first-party needle. */
export function auditSemanticCapability(capability, {
  root = process.cwd(), reviewStatus = "reviewed-documentation",
} = {}) {
  if (!capability) return {
    availability:"missing-record",reason:"Capability absent from the reviewed record.",
    evidenceChecks:[],
  };
  const evidence = Array.isArray(capability.evidence) ? capability.evidence : [];
  const evidenceChecks = evidence.map(item=>inspectCodeEvidence(item,{root}));
  const result = (availability,reason) => ({availability,reason,evidenceChecks});
  if (reviewStatus !== "reviewed-documentation")
    return result("missing-evidence","Overlay has not been reviewed; no implementation claim is accepted.");
  if (capability.state === "documented-not-implemented") {
    return evidence.length === 0
      ? result("not-implemented","Reviewed record explicitly declares this capability not implemented.")
      : result("missing-evidence","Documented-only state contradicts implementation evidence.");
  }
  if (capability.state === "runtime-review-required") {
    return evidence.length === 0
      ? result("runtime-review-required","Behavior awaits runtime/browser review; static presence cannot certify it.")
      : result("missing-evidence","Runtime-review state unexpectedly asserts static implementation evidence.");
  }
  if (capability.state !== "implemented-static-evidence")
    return result("missing-evidence","Unknown or absent implementation state.");
  if (!evidence.length)
    return result("missing-evidence","Claimed implementation has no first-party code references.");
  if (evidenceChecks.some(item=>item.status !== "matched"))
    return result("missing-evidence","One or more cited paths or literal code fragments could not be verified.");
  return result("verified-static","All cited first-party code fragments matched; runtime and Pi admission remain unverified.");
}

export function buildCapabilityGapAudit(profiles, {root = process.cwd()} = {}) {
  const entries = profiles.filter(p=>p.curatedSource).flatMap(profile=>
    (profile.capabilities ?? []).map(capability=>({
      component:profile.component,
      capability:capability.id,
      description:capability.description,
      state:capability.state,
      source:profile.curatedSource,
      documentationReview:profile.documentationReview,
      approvedPiType:profile.approvedPiType === true,
      knowledgeAdmission:profile.knowledgeAdmission,
      admission:"advisory-only",
      ...auditSemanticCapability(capability,{
        root,reviewStatus:profile.documentationReview,
      }),
      testRequirements:capability.testRequirements ?? [],
    }))
  ).sort((a,b)=>a.component.localeCompare(b.component) ||
    String(a.capability).localeCompare(String(b.capability)));
  const counts=Object.fromEntries(availabilityValues.map(x=>[x,0]));
  for (const item of entries) counts[item.availability]++;
  const gaps=entries.filter(x=>x.availability !== "verified-static");
  const perComponent = [...new Set(entries.map(x=>x.component))].sort().map(component=>{
    const rows=entries.filter(x=>x.component===component);
    return {component,total:rows.length,
      verifiedStatic:rows.filter(x=>x.availability==="verified-static").length,
      gaps:rows.filter(x=>x.availability!=="verified-static").length};
  });
  return {
    schemaVersion:1,
    authority:"advisory-only",
    disclaimer:"Code presence is not runtime certification or Pi admission. Lack of evidence is not proof that code is absent; documentary gaps cannot create schemas, props, events, or permissions.",
    source:"src/ui-catalog/knowledge/",
    summary:{components:perComponent.length,capabilities:entries.length,
      byAvailability:counts,gaps:gaps.length},
    perComponent,entries,gaps,
  };
}
