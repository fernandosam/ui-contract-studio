/** Validates real Pi-generated specs only. Missing outputs are never successes. */
import {readFileSync,existsSync,mkdirSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {catalog,componentDefinitions,componentEventDescriptors,actionDefinitions} from '../src/ui-catalog/catalog';
import {graphErrors} from './lib/spec-invariants.mjs';
const strict=process.argv.includes('--strict');
const suite=JSON.parse(readFileSync('tests/prompt-evals/scenarios.json','utf8')) as {
 version?:string|number;scenarios:Array<{id:string;prompt:string;requiredTypes:string[]}>};
type Result={id:string;status:'pass'|'fail'|'not-run';repaired?:boolean;repairAttempted?:boolean;firstPass?:boolean;durationMs?:number;inputTokens?:number;outputTokens?:number;model?:string;types?:number;issues?:string[];reason?:string};
const results:Result[]=[];
for(const scenario of suite.scenarios){
 const path=`eval-results/${scenario.id}.json`;
 const metaPath=`eval-results/${scenario.id}.meta.json`;
 if(!existsSync(path)){results.push({id:scenario.id,status:'not-run',reason:'Sem saída do Pi'});continue;}
 try{
  const spec=JSON.parse(readFileSync(path,'utf8'));
  const validation=catalog.validate(spec);
  const errors=graphErrors(spec,Object.keys(componentDefinitions),{allowedActions:Object.keys(actionDefinitions),allowedEvents:componentEventDescriptors});
  const types=new Set(Object.values(spec.elements??{}).map((el:unknown)=>(el as {type?:string}).type));
  const missing=scenario.requiredTypes.filter(type=>!types.has(type));
  // Never persist raw graph/Zod diagnostics: they may echo generated user content.
  const issues=[...(errors.length?[`Falhas estruturais: ${errors.length}`]:[]),...missing.map(type=>`Falta componente ${type}`),...(!validation.success?['Validação Zod inválida']:[])];
  let meta:Record<string,unknown>|null=null;
  if(existsSync(metaPath)){
   const metadata=JSON.parse(readFileSync(metaPath,'utf8')) as Record<string,unknown>;
    meta=metadata;
   const hash=createHash('sha256').update(JSON.stringify(spec)).digest('hex');
   if(metadata.sha256!==hash||metadata.id!==scenario.id||metadata.source!=='pi-cli-jsonl')issues.push('Metadados Pi inválidos ou especificação alterada');
  } else if(strict){ issues.push('Falta evidência de execução real (arquivo .meta.json)'); }
  const firstPass=issues.length===0;
  let repaired=false;
  const repairPath=`eval-results/${scenario.id}.repair.json`;
  const repairMetaPath=`eval-results/${scenario.id}.repair.meta.json`;
  const repairAttempted=existsSync(repairPath);
  if(!firstPass&&repairAttempted&&(!strict||meta?.source==='pi-cli-jsonl')){
   try{
    const replacement=JSON.parse(readFileSync(repairPath,'utf8'));
    const checked=catalog.validate(replacement);
    const graph=graphErrors(replacement,Object.keys(componentDefinitions),{allowedActions:Object.keys(actionDefinitions),allowedEvents:componentEventDescriptors});
    const names=new Set(Object.values(replacement.elements??{}).map((el:unknown)=>(el as {type?:string}).type));
    const omitted=scenario.requiredTypes.filter(x=>!names.has(x));
    if(!existsSync(repairMetaPath))throw new Error('Faltam metadados do reparo');
    const proof=JSON.parse(readFileSync(repairMetaPath,'utf8'));
    const hash=createHash('sha256').update(JSON.stringify(replacement)).digest('hex');
    if(proof.source!=='pi-cli-jsonl'||proof.id!==scenario.id||proof.attempt!==2||proof.sha256!==hash)throw new Error('Hash/metadados do reparo inválidos');
    repaired=checked.success&&graph.length===0&&omitted.length===0;
    if(!repaired)issues.push('Tentativa de reparo não passou Zod/grafo/tipos exigidos');
   }catch{issues.push('Reparo inválido')}
  }
  results.push({id:scenario.id,status:firstPass||repaired?'pass':'fail',firstPass,repaired,repairAttempted,issues:repaired?[]:issues,types:types.size,
   durationMs:typeof meta?.durationMs==='number'?meta.durationMs:undefined,
   inputTokens:typeof meta?.inputTokens==='number'?meta.inputTokens:undefined,
   outputTokens:typeof meta?.outputTokens==='number'?meta.outputTokens:undefined,
   model:typeof meta?.model==='string'&&/^[a-zA-Z0-9][a-zA-Z0-9_./:-]{0,99}$/.test(meta.model)?meta.model:undefined});
 }catch{results.push({id:scenario.id,status:'fail',issues:['Erro interno na avaliação']});}
}
mkdirSync('reports',{recursive:true});
const pass=results.filter(r=>r.status==='pass').length,missing=results.filter(r=>r.status==='not-run').length,failed=results.filter(r=>r.status==='fail').length;
const timed=results.filter(r=>r.status==='pass'&&r.durationMs!==undefined);
const durations=timed.map(r=>r.durationMs!).sort((a,b)=>a-b);
const p95=durations.length?durations[Math.ceil(durations.length*.95)-1]:null;
const sum=(key:'inputTokens'|'outputTokens')=>timed.reduce((n,r)=>n+(r[key]??0),0);
const uniqueTypes=new Set<string>();
for(const r of results.filter(r=>r.status==='pass')){
 try{const spec=JSON.parse(readFileSync(`eval-results/${r.id}${r.repaired?'.repair':''}.json`,'utf8'));for(const el of Object.values(spec.elements??{}))uniqueTypes.add((el as {type:string}).type);}catch{/* already recorded */}
}
const firstPassCount=results.filter(r=>r.firstPass===true).length;
const repairedCount=results.filter(r=>r.repaired===true).length;
const repairAttemptedCount=results.filter(r=>r.repairAttempted===true).length;
const summary={suiteVersion:suite.version,executedAt:new Date().toISOString(),total:results.length,passed:pass,failed,notRun:missing,
 firstPassRateExecuted:pass+failed?Number((100*firstPassCount/(pass+failed)).toFixed(2)):null,
 repairs:{attempted:repairAttemptedCount,successful:repairedCount,successRate:repairAttemptedCount?Number((100*repairedCount/repairAttemptedCount).toFixed(2)):null},
 passRateExecuted:pass+failed?Number((100*pass/(pass+failed)).toFixed(2)):null,
 catalogCoverage:{usedTypes:uniqueTypes.size,approvedTypes:Object.keys(componentDefinitions).length},
 durationsMs:{sampleCount:durations.length,mean:durations.length?Math.round(durations.reduce((a,b)=>a+b,0)/durations.length):null,p95},
 tokens:{sampleCount:timed.filter(r=>r.inputTokens!==undefined&&r.outputTokens!==undefined).length,input:sum('inputTokens'),output:sum('outputTokens')},
 resultPolicy:'Sem saída real do Pi não há pontuação; ausência de metadata falha no modo --strict.',results};
writeFileSync('reports/pi-evaluation.json',JSON.stringify(summary,null,2)+'\n');
const markdown=['# Relatório de avaliação Pi',`Data: ${summary.executedAt}`,'',
 `**${pass} aprovados, ${failed} falhos, ${missing} não executados**, total ${results.length}.`,
 `Taxa após eventual reparo: ${summary.passRateExecuted===null?'N/D':summary.passRateExecuted+'%'}.`,
 `Primeira tentativa: ${summary.firstPassRateExecuted===null?'N/D':summary.firstPassRateExecuted+'%'}. Reparos: ${summary.repairs.successful}/${summary.repairs.attempted}.`,
 `Tipos de componente exercitados: ${uniqueTypes.size}/${summary.catalogCoverage.approvedTypes}.`,
 `Latência média: ${summary.durationsMs.mean??'N/D'}ms; p95: ${p95??'N/D'}ms.`,
 `Tokens registrados: ${summary.tokens.input} entrada e ${summary.tokens.output} saída (${summary.tokens.sampleCount} medições; zero sem medições não significa consumo zero).`,
 '', '| Cenário | Status | Duração | Problemas |','|---|---|---:|---|',
 ...results.map(r=>`| ${r.id} | ${r.status} | ${r.durationMs??'—'}ms | ${(r.issues??[]).join('; ').replaceAll('|','/')} |`),
 '', '> Não confundir testes de arquitetura com qualidade de geração do agente.'];
writeFileSync('reports/pi-evaluation.md',markdown.join('\n')+'\n');
console.log(`Pi eval: ${pass} aprovados, ${failed} falhos, ${missing} não executados de ${results.length}. Relatórios em reports/.`);
if(failed||(strict&&missing))process.exitCode=1;
