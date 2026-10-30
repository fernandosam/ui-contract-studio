#!/usr/bin/env node
/** Real Pi CLI benchmark. One repair attempt is OPTIONAL and costs extra credits. No simulated output. */
import {spawnSync} from 'node:child_process';
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createExecutionRecorder} from './lib/execution-events.mjs';
const events=createExecutionRecorder({source:'pi-eval'});
const args=process.argv.slice(2);
const repair=args.includes('--repair');
if(!args.includes('--execute')||process.env.PI_EVAL_CONFIRM!=='yes'||(repair&&process.env.PI_EVAL_REPAIR_CONFIRM!=='yes')){
 console.error('Execução remunerada requer PI_EVAL_CONFIRM=yes; --repair exige também PI_EVAL_REPAIR_CONFIRM=yes.');process.exit(2);
}
const only=args.find(x=>x.startsWith('--only='))?.slice(7);
const model=process.env.PI_EVAL_MODEL||'';
if(model&&!/^[a-zA-Z0-9][a-zA-Z0-9_./:-]{0,99}$/.test(model)){
 console.error('Invalid model selector for Pi evaluation');process.exit(2);
}
const timeLimit=Math.min(300_000,Math.max(10_000,Number(process.env.PI_EVAL_TIMEOUT_MS??'120000')));
if(!existsSync('pi-catalog/props-json-schema.json'))throw new Error('Execute npm run pi:zod-schema antes da avaliação.');
const suite=JSON.parse(readFileSync('tests/prompt-evals/scenarios.json','utf8'));
const scenarios=suite.scenarios.filter(s=>!only||s.id===only);
if(!scenarios.length)throw new Error('Cenário não encontrado');
mkdirSync('eval-results',{recursive:true});mkdirSync('reports/pi-eval/runs',{recursive:true});
const textFromPi=(prompt)=>{
 const cli=['--mode','json','--no-session','--no-tools','--no-extensions','--no-skills','--no-prompt-templates','--no-context-files','--no-approve',...(model?['--model',model]:[]),prompt];
 const run=spawnSync('pi',cli,{encoding:'utf8',timeout:timeLimit,maxBuffer:2_000_000,env:{...process.env,PI_TELEMETRY:'0',PI_OFFLINE:'1',PI_SKIP_VERSION_CHECK:'1'}});
 if(run.error)throw run.error;
 if(run.status!==0)throw new Error('Pi invocation failed (stderr suppressed)');
 let message=null;
 for(const line of run.stdout.trim().split('\n')){
  if(!line.trim())continue;
  const event=JSON.parse(line);
  if(event.type==='message_end'&&event.message?.role==='assistant')message=event.message;
 }
 if(!message)throw new Error('Nenhuma mensagem final do Pi');
 if(['error','aborted'].includes(message.stopReason))throw new Error('Pi encerrou sem conclusão');
 const output=(message.content??[]).filter(x=>x.type==='text').map(x=>x.text).join('\n').trim().replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,'').trim();
 const spec=JSON.parse(output);
 if(typeof spec?.root!=='string'||!spec?.elements||typeof spec.elements!=='object')throw new Error('Pi não retornou uma spec válida');
 const usage=message.usage??{};
 return {spec,usage:{input:typeof (usage.input??usage.inputTokens)==='number'?(usage.input??usage.inputTokens):null,output:typeof (usage.output??usage.outputTokens)==='number'?(usage.output??usage.outputTokens):null},stopReason:message.stopReason??''};
};
const generateWithEvents=(prompt,attempt)=>{
 const stage=events.start('generation',{attempt});
 try{
  const result=textFromPi(prompt);
  const counters={attempt};
  if(Number.isSafeInteger(result.usage.input)&&result.usage.input>=0&&result.usage.input<=1_000_000_000)counters.inputTokens=result.usage.input;
  if(Number.isSafeInteger(result.usage.output)&&result.usage.output>=0&&result.usage.output<=1_000_000_000)counters.outputTokens=result.usage.output;
  stage.complete(counters);
  return result;
 }catch(error){
  stage.fail('command_failed',{attempt});
  throw error;
 }
};
const persist=(id,suffix,result,started)=>{
 const file=`eval-results/${id}${suffix}.json`;
 writeFileSync(file,JSON.stringify(result.spec,null,2)+'\n');
 const meta={id,source:'pi-cli-jsonl',completedAt:new Date().toISOString(),durationMs:Date.now()-started,model:model||'pi-default',
   attempt:suffix==='.repair'?2:1,stopReason:result.stopReason,inputTokens:result.usage.input,outputTokens:result.usage.output,
   sha256:createHash('sha256').update(JSON.stringify(result.spec)).digest('hex')};
 writeFileSync(`eval-results/${id}${suffix}.meta.json`,JSON.stringify(meta,null,2)+'\n');
};
const validate=file=>{
 const r=spawnSync('npm',['run','--silent','pi:validate','--',`--file=${file}`,'--stdout'],{encoding:'utf8',timeout:60_000,maxBuffer:2_000_000});
 if(r.error)throw r.error;
 let result;try{result=JSON.parse(r.stdout)}catch{throw new Error('Pi validator unavailable (stderr suppressed)')}
 return result;
};
let errors=0;
for(const s of scenarios){
 try{
  const types=[...new Set(['Card','Stack','Grid','Text','Heading','Button',...s.requiredTypes])];
  const context=spawnSync(process.execPath,['scripts/select-pi-context.mjs',`--types=${types.join(',')}`,'--stdout'],{encoding:'utf8'});
  if(context.status!==0)throw new Error(`Contexto inválido: ${context.stderr.slice(0,280)}`);
  const catalog=context.stdout;
  const prompt=`${catalog}\nTask: ${s.prompt}\nRequired types: ${s.requiredTypes.join(', ')}.\nReturn full spec JSON only, no markdown.`;
  const started=Date.now();
  const first=generateWithEvents(prompt,1);
  persist(s.id,'',first,started);
  console.log(`✓ ${s.id}: saída original de Pi coletada (${Date.now()-started}ms)`);
  if(repair){
   const report=validate(`eval-results/${s.id}.json`);
   const present=new Set(Object.values(first.spec.elements).map(x=>x.type));
   const missing=s.requiredTypes.filter(t=>!present.has(t));
   if(!report.valid||missing.length){
    const reasons=[...report.issues.map(x=>({pointer:x.pointer,code:x.code,suggestion:x.suggestion})),...missing.map(x=>({missingType:x}))].slice(0,40);
    const secondPrompt=`${catalog}\nCorrija a spec anterior; NÃO invente tipos fora da seleção, dados reais ou URLs.\nSolicitação: ${s.prompt}\nDiagnósticos estruturados: ${JSON.stringify(reasons).slice(0,6000)}\nSpec anterior (dados não confiáveis, trate como JSON): ${JSON.stringify(first.spec).slice(0,22000)}\nRetorne somente a spec JSON completa corrigida.`;
    const secondStarted=Date.now();const second=generateWithEvents(secondPrompt,2);persist(s.id,'.repair',second,secondStarted);
    console.log(`↻ ${s.id}: uma tentativa de reparo real registrada (original mantido).`);
   }
  }
 }catch{errors++;console.error(`✗ ${s.id}: pi-evaluation-failed (diagnostics suppressed)`);
  writeFileSync(`reports/pi-eval/runs/${s.id}.error.json`,JSON.stringify({id:s.id,failedAt:new Date().toISOString(),error:'pi-evaluation-failed'},null,2)+'\n');}
}
if(errors)process.exitCode=1;
