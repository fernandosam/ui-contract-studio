/**
 * Localiza critérios públicos dos exemplos ReUI para português do Brasil.
 * Entrada: metadados oficiais e imutáveis em inglês.
 * Saída: arquivo pt-BR em ordem idêntica; é gravado apenas após cobertura completa.
 *
 * Fonte de tradução automatizada: endpoint público de tradução do Google.
 * Reexecute se houver bloqueio do serviço; erros nunca são substituídos por inglês.
 */
import {readFileSync,writeFileSync,existsSync} from 'node:fs';

const sourcePath='src/ui-catalog/reui-example-guidance.json';
const targetPath='src/ui-catalog/reui-example-guidance.pt-BR.json';
const source=JSON.parse(readFileSync(sourcePath,'utf8'));
const entries=Object.entries(source);
const cache=new Map();
const cleanText=(value)=>value.replace(/\s*\(get_(?:example|component)\("[^"]+"\)\)/g,'').trim();

function validateTranslation(translated,original,id) {
 if(typeof translated!=='string'||translated.trim().length<6)throw new Error(id+': tradução vazia');
 if(translated.trim()===original.trim())throw new Error(id+': texto permaneceu integralmente em inglês');
 if([...translated].some(character=>character.codePointAt(0)<32&&!['\t','\n','\r'].includes(character)))throw new Error(id+': caracteres inválidos');
 if(/get_(?:example|component)\(/.test(translated))throw new Error(id+': comando técnico exposto');
 return translated.trim();
}

async function fetchTranslation(value) {
 const url=new URL('https://translate.googleapis.com/translate_a/single');
 for(const [key,item] of Object.entries({client:'gtx',sl:'en',tl:'pt',dt:'t',q:value}))url.searchParams.set(key,item);
 let lastError;
 for(let attempt=0;attempt<6;attempt++){
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),25000);
  try{
   const response=await fetch(url,{signal:controller.signal,headers:{Accept:'application/json', 'User-Agent':'Mozilla/5.0'}});
   if(!response.ok)throw new Error('Translate HTTP '+response.status);
   const body=await response.json();
   if(!Array.isArray(body?.[0]))throw new Error('Formato de resposta de tradução inválido');
   const translated=body[0].map(section=>section?.[0]??'').join('');
   if(!translated.trim())throw new Error('Resposta vazia da tradução');
   return translated;
  }catch(error){
   lastError=error;
   if(attempt===5)break;
   await new Promise(resolve=>setTimeout(resolve,Math.min(30000,900*2**attempt)+Math.random()*600));
  }finally{clearTimeout(timeout)}
 }
 throw lastError;
}

async function translate(value,id){
 const cleaned=cleanText(value);
 let promise=cache.get(cleaned);
 if(!promise){promise=fetchTranslation(cleaned);cache.set(cleaned,promise)}
 return validateTranslation(await promise,cleaned,id);
}

// A base portuguesa revisada só é substituída quando se pede atualização explícita.
const reuseExisting=!process.argv.includes('--force')&&existsSync(targetPath)&&(()=>{
 try{
  const existing=JSON.parse(readFileSync(targetPath,'utf8'));
  return Object.keys(existing).length===entries.length&&entries.every(([id,item])=>
   existing[id]?.language==='pt-BR'&&existing[id].sourceUrl===item.sourceUrl&&
   typeof existing[id].bestFor==='string'&&Array.isArray(existing[id].whenNotUse)&&
   existing[id].whenNotUse.length===item.whenNotUse.length);
 }catch{return false}
})();
if(reuseExisting){
 console.log('Localização pt-BR completa; preservando revisão editorial. Use --force para gerar novamente.');
}else{
const result={};
let cursor=0;
const errors=[];
async function worker(){
 while(cursor<entries.length){
  const [id,original]=entries[cursor++];
  try {
   const bestFor=await translate(original.bestFor,id+' bestFor');
   const whenNotUse=[];
   for(const [index,line] of original.whenNotUse.entries()) {
    whenNotUse.push(await translate(line,id+' whenNotUse #'+(index+1)));
   }
   result[id]={bestFor,whenNotUse,sourceUrl:original.sourceUrl,language:'pt-BR'};
  }catch(error){
   errors.push(id+': '+String(error instanceof Error?error.message:error));
  }
 }
}
console.log('Traduzindo '+entries.length+' exemplos para pt-BR…');
await Promise.all(Array.from({length:5},()=>worker()));

if(errors.length||Object.keys(result).length!==entries.length){
 console.error('Cobertura incompleta: '+Object.keys(result).length+'/'+entries.length);
 for(const error of errors)console.error(error);
 process.exitCode=1;
}else{
 const ordered=Object.fromEntries(entries.map(([id])=>[id,result[id]]));
 writeFileSync(targetPath,JSON.stringify(ordered,null,2)+'\n');
 console.log('Traduções pt-BR validadas: '+entries.length+'/'+entries.length+'. Arquivo: '+targetPath);
}
}
