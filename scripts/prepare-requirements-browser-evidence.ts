import {mkdirSync,rmSync,writeFileSync} from "node:fs";
import {join} from "node:path";
import {
 patternEvidenceCases,patternEvidenceRoot,specFingerprint
} from "./lib/requirements-browser-evidence";

const revision=process.env.GITHUB_SHA??"";
const runId=process.env.GITHUB_RUN_ID??"";
if(!/^[0-9]+$/.test(runId))throw Error("GITHUB_RUN_ID required for workflow-bound browser preflight");
if(!/^[a-f0-9]{40}$/.test(revision))
 throw Error("GITHUB_SHA required for source-bound browser preflight");
const folder=join(process.cwd(),patternEvidenceRoot);
rmSync(folder,{recursive:true,force:true});
mkdirSync(folder,{recursive:true});
const manifest={schemaVersion:1,sourceRevision:revision,runId,
 cases:patternEvidenceCases.map(item=>({
  caseId:item.id,flow:item.flow,
  specFingerprint:specFingerprint(item),checkedRequirementIds:item.checked
 }))};
writeFileSync(join(folder,"expected.json"),JSON.stringify(manifest,null,2)+"\n");
console.log("Prepared "+manifest.cases.length+" browser cases for "+revision);
