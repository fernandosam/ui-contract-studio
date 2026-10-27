import {inspectPatternBrowserEvidence} from "../src/ui-requirements/browser-evidence";
if(process.env.GITHUB_ACTIONS!=="true"||
 !process.env.GITHUB_SHA||!process.env.GITHUB_RUN_ID)
 throw Error("Verificação requer contexto autenticado do job GitHub Actions");
const result=inspectPatternBrowserEvidence(process.cwd(),process.env.GITHUB_SHA,process.env.GITHUB_RUN_ID);
console.log(JSON.stringify(result,null,2));
if(result.cases!==8)process.exitCode=1;
