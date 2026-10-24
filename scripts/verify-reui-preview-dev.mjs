/**
 * Comprova que o servidor Vite do npm run dev entrega o conteúdo traduzido.
 * Executa uma requisição ao TSX transformado localmente, sem abrir navegador.
 */
import { spawn } from "node:child_process";

const port=5179;
const address="http://127.0.0.1:"+port;
const server=spawn(process.execPath,["node_modules/vite/bin/vite.js","--host","127.0.0.1","--port",String(port),"--strictPort"],{
 stdio:["ignore","pipe","pipe"],env:{...process.env,NO_COLOR:"1"}
});
let output="";
server.stdout.on("data",chunk=>{output+=chunk.toString();});
server.stderr.on("data",chunk=>{output+=chunk.toString();});
const delay=(ms)=>new Promise(resolve=>setTimeout(resolve,ms));
const samples=[
 {url:"/src/ui-catalog/extensions/composites/reui-alert-1.tsx",expected:"Alerta!",original:"This is an alert with a title and description."},
 {url:"/src/ui-catalog/extensions/composites/reui-alert-4.tsx",expected:"Falha no pagamento",original:"Payment Failed"},
 {url:"/src/ui-catalog/extensions/composites/reui-button-1.tsx",expected:"Padrão",original:"Default"},
];
try{
 let ready=false;
 for(let i=0;i<50;i++){
  if(server.exitCode!==null)throw Error("Servidor Vite finalizado antes do teste: "+output.slice(-1200));
  try{const response=await fetch(address+"/");
   if(response.ok){ready=true;break;}
  }catch{/* not ready */}
  await delay(500);
 }
 if(!ready)throw Error("Servidor Vite não iniciou: "+output.slice(-1500));
 for(const sample of samples){
  const response=await fetch(address+sample.url);
  const code=await response.text();
  if(!response.ok)throw Error("HTTP "+response.status+" em "+sample.url+": "+code.slice(0,400));
  if(!code.includes(sample.expected))throw Error(sample.url+" não incluiu "+sample.expected);
  if(code.includes(sample.original))throw Error(sample.url+" manteve o texto inglês "+sample.original);
 }
 console.log("Vite dev: 3 prévias localizadas corretamente, sem textos originais em inglês.");
}finally{
 server.kill("SIGTERM");
}
