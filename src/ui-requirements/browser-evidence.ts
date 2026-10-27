import {createHash} from "node:crypto";
import {readFileSync} from "node:fs";
import {join} from "node:path";
import lock from "../ui-catalog/contracts.lock.json";
import {resolvePattern,generatePatternPreview} from "./patterns";
import {tracePattern} from "./traceability";
import {catalog} from "../ui-catalog/catalog";

export const auditedPatterns=["login","search","list","dashboard"] as const;
export const auditedProjects=["desktop","mobile"] as const;
const sha256=(value:Buffer|string)=>createHash("sha256").update(value).digest("hex");
const pngHeader=Buffer.from([137,80,78,71,13,10,26,10]);
export function patternSnapshot(pattern:string){
 if(!(auditedPatterns as readonly string[]).includes(pattern))throw Error("Padrão não auditado: "+pattern);
 const req=resolvePattern(pattern);
 const screen=generatePatternPreview(req);
 const trace=tracePattern(req,screen);
 if(!catalog.validate(screen).success||!trace.structurallyValid)throw Error("Prévia estática inconsistente");
 return {
  specFingerprint:sha256(JSON.stringify({family:pattern,screen,lock:lock.schemaVersion})),
  requirementIds:trace.requirements.map(x=>x.id),
 };
}
export type PatternBrowserEvidence={
 schemaVersion:1;sourceRevision:string;runId:string;pattern:string;project:string;caseId:string;
 specFingerprint:string;requirementIds:string[];status:string;expectedStatus:string;
 screenshotSha256:string;errors:string[];
};
/**
 * Recheck proof created by browser tests in the *same trusted CI job*. File content alone
 * is not a signed GitHub attestation. Do not import as certification outside that job.
 */
export function inspectPatternBrowserEvidence(root:string,sourceRevision:string,runId:string){
 if(!/^[0-9a-f]{40}$/.test(sourceRevision)||!/^[0-9]+$/.test(runId))
  throw Error("Revisão/execução não verificável");
 const proof:PatternBrowserEvidence[]=[];
 for(const project of auditedProjects)for(const pattern of auditedPatterns){
  const base=join(root,"reports/requirements/browser-evidence",project,pattern);
  const record=JSON.parse(readFileSync(base+".json","utf8")) as PatternBrowserEvidence;
  const png=readFileSync(base+".png");
  const snapshot=patternSnapshot(pattern);
  if(record.schemaVersion!==1||record.pattern!==pattern||record.project!==project||
   record.sourceRevision!==sourceRevision||record.runId!==runId||
   record.caseId!=="preview-renders"||
   record.specFingerprint!==snapshot.specFingerprint||
   JSON.stringify(record.requirementIds)!==JSON.stringify(snapshot.requirementIds)||
   record.status!=="passed"||record.expectedStatus!=="passed"||
   !Array.isArray(record.errors)||record.errors.length||
   png.length<=8||!png.subarray(0,8).equals(pngHeader)||
   record.screenshotSha256!==sha256(png))
   throw Error("Evidência inválida, antiga ou incompatível: "+project+"/"+pattern);
  proof.push(record);
 }
 return {schemaVersion:1 as const,sourceRevision,runId,cases:proof.length,
  patternResults:proof.map(x=>({pattern:x.pattern,project:x.project,
    status:"tested" as const,requirementIds:x.requirementIds,
    specFingerprint:x.specFingerprint,evidence:"local verified CI artifact"})),
  limitation:"Only tested preview rendering and declared assertions; not authentication, backend or complete accessibility certification."};
}
