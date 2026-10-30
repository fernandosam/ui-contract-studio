/** Validates generated json-render specs with the real Zod registry; produces compact, actionable, data-free diagnostics. */
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {createExecutionRecorder} from './lib/execution-events.mjs';
import {catalog,experimentalCatalog,stableComponentDefinitions,unifiedComponentDefinitions,stableComponentEventDescriptors,experimentalComponentEventDescriptors,actionDefinitions} from '../src/ui-catalog/catalog';
import {graphErrors} from './lib/spec-invariants.mjs';

type Finding={pointer:string;code:string;message:string;expected?:unknown;suggestion:string};
const eventStage=createExecutionRecorder({source:'pi-validate'}).start('validation');
const args=process.argv.slice(2);
const file=args.find(a=>a.startsWith('--file='))?.slice(7);
const dest=args.find(a=>a.startsWith('--out='))?.slice(6);
const print=args.includes('--stdout')||!dest;
const channel=args.includes('--channel=experimental')?'experimental':'stable';
if(args.some(x=>x.startsWith('--channel=')&&!['--channel=stable','--channel=experimental'].includes(x))){
 console.error('Canal inválido');process.exit(2);
}
if(!file||!file.endsWith('.json')||file.includes('..')){
 console.error('Uso: npm run pi:validate -- --file=reports/generated/spec.json [--out=reports/pi-validation/result.json]');process.exit(2);
}
if(dest&&(!dest.startsWith('reports/pi-validation/')||!dest.endsWith('.json')||dest.includes('..'))){console.error('Output limitado a reports/pi-validation/*.json');process.exit(2)}
const escapePointer=(s:string)=>s.replaceAll('~','~0').replaceAll('/','~1');
const findings:Finding[]=[];
let spec:unknown;
try{ spec=JSON.parse(readFileSync(resolve(file),'utf8')); }
catch {findings.push({pointer:'',code:'invalid_json',message:'Sintaxe JSON inválida ou arquivo indisponível.',suggestion:'Retorne um objeto JSON válido, sem markdown.'});}
if(spec!==undefined){
 const actual=channel==='experimental'?experimentalCatalog.validate(spec):catalog.validate(spec);
 if(!actual.success){
  for(const issue of actual.error?.issues ?? []){
   const pointer='/'+issue.path.map(x=>escapePointer(String(x))).join('/');
   const code=String(issue.code);
   const expected='expected' in issue?issue.expected:undefined;
   let suggestion='Consulte o propsSchema selecionado e corrija o tipo ou valor.';
   if(pointer.endsWith('/children'))suggestion='Adicione children: [] em todos os nós, inclusive folhas.';
   if(code==='unrecognized_keys')suggestion='Remova propriedades desconhecidas; schema Zod é estrito.';
   if(code==='invalid_union'||code==='invalid_value')suggestion='Use um dos valores permitidos em enum/union.';
   findings.push({pointer,code,message:issue.message,...(expected?{expected}:{}),suggestion});
  }
 }
 const structure=graphErrors(spec,Object.keys(channel==='experimental'?unifiedComponentDefinitions:stableComponentDefinitions),{
  allowedActions:Object.keys(actionDefinitions),allowedEvents:channel==='experimental'?experimentalComponentEventDescriptors:stableComponentEventDescriptors
 });
 for (const message of structure) {
  const match=message.match(/^([^:]+): (children|slots\.[a-zA-Z0-9_-]+) deve ser array\.$/);
  const pointer=match?'/elements/'+escapePointer(match[1])+'/'+match[2].split('.').map(escapePointer).join('/'):'';
  findings.push({pointer,code:'graph_invariant',message,suggestion:'Confira children, referências existentes, tipos aprovados e eventos declarados.'});
 }
}
const result={valid:findings.length===0,source:file,channel,validator:'real-zod-catalog',issues:findings.slice(0,100),truncated:findings.length>100};
const output=JSON.stringify(result,null,2)+'\n';
if(print) process.stdout.write(output);
if(dest){mkdirSync(dirname(dest),{recursive:true});writeFileSync(dest,output)}
if(result.valid)eventStage.complete({channel,valid:true,issueCount:0});
else eventStage.fail('validation_failed',{channel,valid:false,issueCount:findings.length});
process.exitCode=result.valid?0:1;
