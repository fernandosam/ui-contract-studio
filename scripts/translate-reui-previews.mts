/**
 * Localiza apenas mensagens visíveis das composições ReUI.
 * O TSX original permanece intacto; o plugin Vite aplica as traduções no dev/build.
 * Nunca traduz nomes de import, props técnicas, seletores CSS ou atributos de controle.
 */
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { extractPreviewTexts, isReuiExampleModule } from "../src/ui-catalog/reui-preview-i18n";

const directory = "src/ui-catalog/extensions/composites";
const destination = "src/ui-catalog/reui-preview-text.pt-BR.json";
const files = readdirSync(directory).filter(isReuiExampleModule).sort();
const existing = JSON.parse(readFileSync(destination, "utf8")) as Record<string,string>;
const all = new Set<string>();
const fileCounts:Record<string,number>={};
for(const filename of files){
 const texts=extractPreviewTexts(readFileSync(join(directory,filename),"utf8"),filename);
 fileCounts[filename]=texts.length;
 texts.forEach(text=>all.add(text));
}
if(files.length!==559)throw Error("Quantidade inesperada de exemplos: "+files.length);
const candidates=[...all].sort((a,b)=>a.localeCompare(b,"en"));
const outstanding=candidates.filter(text=>!existing[text]?.trim());
console.log("Prévia ReUI: "+files.length+" arquivos, "+candidates.length+" frases distintas, "+outstanding.length+" faltando");

async function translate(input:string):Promise<string>{
 const url=new URL("https://translate.googleapis.com/translate_a/single");
 for(const [k,v] of Object.entries({client:"gtx",sl:"en",tl:"pt",dt:"t",q:input}))url.searchParams.set(k,v);
 let lastError:unknown;
 for(let retry=0;retry<6;retry++){
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),22000);
  try{
   const response=await fetch(url,{signal:controller.signal,headers:{Accept:"application/json", "User-Agent":"Mozilla/5.0"}});
   if(!response.ok)throw Error("HTTP "+response.status);
   const result=await response.json();
   if(!Array.isArray(result?.[0]))throw Error("Formato de resposta inesperado");
   const translated=result[0].map((item:unknown[])=>item?.[0]??"").join("").trim();
   if(!translated||[...translated].some(character=>character.charCodeAt(0)<32 && !["\t","\n","\r"].includes(character)))throw Error("Tradução vazia ou inválida");
   return translated;
  }catch(error){
   lastError=error;
   if(retry<5)await new Promise(resolve=>setTimeout(resolve,900*Math.pow(2,retry)+Math.random()*500));
  }finally{clearTimeout(timeout)}
 }
 throw lastError;
}

const output={...existing};
const errors:string[]=[];
let cursor=0;
let completed=0;
async function worker(){
 while(cursor<outstanding.length){
  const current=outstanding[cursor++];
  try{
   output[current]=await translate(current);
   completed++;
   if(completed%100===0)console.log("Traduzidos "+completed+"/"+outstanding.length+" textos pendentes");
  }catch(error){
   errors.push(current+": "+(error instanceof Error?error.message:String(error)));
  }
 }
}
await Promise.all(Array.from({length:10},()=>worker()));
const missing=candidates.filter(key=>!output[key]?.trim());
if(missing.length||errors.length){
 console.error("Catálogo incompleto: "+missing.length+" frases sem tradução");
 errors.slice(0,35).forEach(error=>console.error(error));
 process.exitCode=1;
}else{
 // Preserve any previous overrides reviewed by humans; translate only absent items.
 const ordered=Object.fromEntries(candidates.map(key=>[key,output[key]]));
 writeFileSync(destination,JSON.stringify(ordered,null,2)+"\n");
 console.log("Catálogo pt-BR pronto: "+files.length+" prévias e "+candidates.length+" textos; "+completed+" novos");
}
