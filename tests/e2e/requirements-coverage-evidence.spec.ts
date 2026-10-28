import {test,expect,type Locator} from "@playwright/test";
import {mkdirSync,writeFileSync,readFileSync} from "node:fs";
import {join} from "node:path";
import {patternEvidenceCases,patternEvidenceRoot} from "../../scripts/lib/pattern-evidence-cases";

/** Real browser assertions. Captures are never pre-populated or replayed. */
async function openPatternPreview(page:import("@playwright/test").Page,item:(typeof patternEvidenceCases)[number]){
 await page.goto("/?screen=criador-padroes");
 const wizard=page.getByTestId("pattern-wizard");
 await wizard.getByLabel("Tipo de tela").selectOption(item.flow);
 for(const [key,value] of Object.entries(item.answers)){
  const labels:Record<string,string>={
   identifier:"Identificação",remember:"Exibir opção lembrar-me?",
   showHelp:"Exibir orientações de acesso?",dateFilter:"Mostrar filtros de datas?",
   selection:"Habilitar seleção de linhas?",pageSize:"Registros por página",
   compact:"Usar tabela compacta?",title:"Título da lista",
   showSummary:"Exibir resumo da listagem?",
   view:"Quais indicadores apresentar?",density:"Quantidade de indicadores?",
   showFootnote:"Mostrar nota sobre os dados?"
  };
  const input=wizard.getByLabel(labels[key]);
  if(typeof value==="boolean"){if(value)await input.check();else await input.uncheck();}
  if(typeof value==="string"){
   const tag=await input.evaluate(el=>el.tagName.toLowerCase());
   if(tag==="select")await input.selectOption(value);
   else await input.fill(value);
  }
 }
 await wizard.getByRole("button",{name:"Gerar interface do padrão"}).click();
 const preview=wizard.getByTestId("pattern-preview");
 await expect(preview).toBeVisible();
 await expect(preview.getByText("A interface foi bloqueada: especificação não autorizada.")).toHaveCount(0);
 return preview;
}
async function assertVisible(preview:Locator,item:(typeof patternEvidenceCases)[number]){
 switch(item.id){
  case "login-default":
   await expect(preview.getByLabel("E-mail")).toBeVisible();
   await expect(preview.getByLabel("Senha")).toHaveAttribute("type","password");
   await expect(preview.getByText("Lembrar-me (local)")).toHaveCount(0);
   await expect(preview.getByText("Use credenciais de demonstração. Nenhuma autenticação será realizada.")).toHaveCount(0);
   break;
  case "login-user":
   await expect(preview.getByLabel("Usuário")).toHaveAttribute("type","text");
   await expect(preview.getByText("Lembrar-me (local)")).toBeVisible();
   await expect(preview.getByText("Use credenciais de demonstração. Nenhuma autenticação será realizada.")).toBeVisible();
   break;
  case "search-default":
   await expect(preview.getByRole("table")).toBeVisible();
   await expect(preview.getByText("Data de referência")).toHaveCount(0);
   break;
  case "search-dates":
   await expect(preview.getByRole("table")).toBeVisible();
   await expect(preview.getByText("Data de referência")).toBeVisible();
   await expect(preview.getByText("Data obrigatória (validação)")).toBeVisible();
   break;
  case "list-default":
   await expect(preview.getByText("Lista de usuários",{exact:true})).toBeVisible();
   await expect(preview.locator("tbody tr")).toHaveCount(7);
   await expect(preview.getByText("Dados fictícios apresentados somente para avaliação visual.")).toHaveCount(0);
   break;
  case "list-compact":
   await expect(preview.getByText("Clientes",{exact:true})).toBeVisible();
   await expect(preview.locator("tbody tr")).toHaveCount(3);
   await expect(preview.getByText("Dados fictícios apresentados somente para avaliação visual.")).toBeVisible();
   break;
  case "dashboard-kpis":
   await expect(preview.locator("article.pg-metric")).toHaveCount(4);
   await expect(preview.getByText("Valores fictícios, sem atualização automática.")).toHaveCount(0);
   break;
  case "dashboard-graphs":
   await expect(preview.getByText("Volume de solicitações (dados fictícios)")).toBeVisible();
   await expect(preview.getByText("Tendência (dados fictícios)")).toBeVisible();
   await expect(preview.getByText("Valores fictícios, sem atualização automática.")).toBeVisible();
   break;
 }
}
for(const item of patternEvidenceCases){
 test("T34 evidence: "+item.id,async({page})=>{
  const preview=await openPatternPreview(page,item);
  await assertVisible(preview,item);
 });
}
test.afterEach(async({page},info)=>{
 const item=patternEvidenceCases.find(x=>info.title==="T34 evidence: "+x.id);
 if(!item)return;
 const project=info.project.name;
 const root=join(process.cwd(),patternEvidenceRoot,project);
 mkdirSync(root,{recursive:true});
 const screenshot=join(root,item.id+".png");
 let screenshotStatus="unavailable";
 try{
  await page.screenshot({path:screenshot,fullPage:true,animations:"disabled"});
  screenshotStatus=info.status==="passed"?"captured":"captured-failure";
 }catch{/* Verifier refuses absent captures. */}
 const preflight=JSON.parse(readFileSync(join(process.cwd(),patternEvidenceRoot,"expected.json"),"utf8"));
 const expected=preflight.cases?.find((c:{caseId:string})=>c.caseId===item.id);
 if(!expected)throw Error("Missing expected browser case from trusted preflight");
 const payload={
  schemaVersion:1,caseId:item.id,flow:item.flow,project,
  sourceRevision:process.env.GITHUB_SHA??"",
  runId:process.env.GITHUB_RUN_ID??"",
  specFingerprint:expected.specFingerprint,checkedRequirementIds:item.checked,
  status:info.status,expectedStatus:info.expectedStatus,retry:info.retry,
  screenshotStatus,errors:info.errors.map(err=>err.message??"unknown")
 };
 writeFileSync(join(root,item.id+".json"),JSON.stringify(payload,null,2)+"\n");
});
