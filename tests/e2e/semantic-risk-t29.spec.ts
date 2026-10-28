import {test,expect,type Page} from "@playwright/test";
import {createHash} from "node:crypto";
import {mkdirSync,readFileSync,writeFileSync} from "node:fs";
import {join} from "node:path";

// T29: each browser assertion is tied to the audited overlay, recommendation,
// source-only proposal or separate admission record. Browser proof is NOT Pi certification.
const read=(path:string)=>JSON.parse(readFileSync(path,"utf8"));
const risks=read("tests/e2e/semantic-risk-cases.json") as {cases:{id:string;priority:string;source:string;scenarioIds:string[];capabilities:string[]}[]};
const overlay=read("src/ui-catalog/knowledge/alert-dialog.json");
const scenarios=read("src/ui-catalog/recommendations/scenarios.json").scenarios;
const official=read("pi-catalog/contracts.json").components;
const entries=read("src/ui-catalog/admission-engine/entries.json").entries;
const certificates=read("src/ui-catalog/admission-engine/certifications.json").components;
const matrixDigest=createHash("sha256")
 .update(readFileSync("tests/e2e/semantic-risk-cases.json")).digest("hex");

function trace(id:string,scenarioId:string,capabilityId?:string,state?:string){
 const risk=risks.cases.find(item=>item.id===id);
 expect(risk,"missing T29 risk register row "+id).toBeDefined();
 expect(risk!.scenarioIds).toContain(scenarioId);
 const scenario=scenarios.find((item:{id:string})=>item.id===scenarioId);
 expect(scenario,"missing audited recommendation "+scenarioId).toBeDefined();
 if(capabilityId){
  expect(risk!.capabilities).toContain(capabilityId);
  expect(scenario.requiredCapabilities).toContain(capabilityId);
  const capability=overlay.capabilities.find((item:{id:string})=>item.id===capabilityId);
  expect(capability,"missing capability "+capabilityId).toBeDefined();
  if(state)expect(capability.state).toBe(state);
 }
 return scenario;
}
async function recommendation(page:Page,family:"AlertDialog"|"Accordion"|"Button",id:string){
 await page.goto("/?screen=explorador-primitivos");
 await page.getByRole("button",{name:family,exact:true}).first().click();
 await page.getByRole("tab",{name:"Semântica e testes"}).click();
 const panel=page.getByTestId("composition-recommendations");
 await expect(panel).toBeVisible();
 await panel.getByLabel("Situação funcional").selectOption(id);
 return panel;
}
const watched=(page:Page)=>{
 const remote:string[]=[];
 page.on("request",r=>{
  if(["xhr","fetch"].includes(r.resourceType()))remote.push(r.url());
 });
 return remote;
};

test.afterEach(async({page},info)=>{
 const id=info.title.match(/T29-R\d{2}/)?.[0];
 const risk=risks.cases.find(item=>item.id===id);
 if(!risk)return;
 const folder=join("reports/semantic-e2e",info.project.name);
 mkdirSync(folder,{recursive:true});
 let screenshotStatus="not-captured";
 try{
  await page.screenshot({path:join(folder,id+".png"),animations:"disabled",fullPage:false});
  screenshotStatus=info.status==="passed"?"captured":"captured-failure";
 }catch{/* Explicitly record missing proof; never use a stale screenshot. */}
 writeFileSync(join(folder,id+".json"),JSON.stringify({
  schemaVersion:1,riskId:id,priority:risk.priority,source:risk.source,
  scenarioIds:risk.scenarioIds,capabilities:risk.capabilities,
  matrixSha256:matrixDigest,sourceRevision:process.env.GITHUB_SHA??null,
  project:info.project.name,status:info.status,expectedStatus:info.expectedStatus,
  retry:info.retry,screenshotStatus,certification:"not-granted",
  errors:info.errors.map(error=>error.message??"unknown"),
 },null,2)+"\n");
});

test("T29-R01 @semantic-risk: static confirm signal is not runtime or backend proof",async({page})=>{
 trace("T29-R01","alert-simple","confirm-signal","implemented-static-evidence");
 trace("T29-R01","alert-simple","focus-and-keyboard","runtime-review-required");
 const panel=await recommendation(page,"AlertDialog","alert-simple");
 const decision=panel.getByTestId("recommendation-decision");
 await expect(decision).toContainText("Reutilizar contrato aprovado");
 await expect(decision).toContainText("O alvo já é um contrato Pi aprovado");
 await expect(panel).toContainText("confirm-signal: verified-static");
 await expect(panel).toContainText("focus-and-keyboard: runtime-review-required");
 await expect(panel).toContainText("Evento confirm não autoriza exclusão");
 await expect(panel).toContainText("Evidências consultadas:");
});

test("T29-R02 @semantic-risk: documented typed confirmation does not add a primitive API",async({page})=>{
 trace("T29-R02","alert-typed","typed-confirmation","documented-not-implemented");
 const panel=await recommendation(page,"AlertDialog","alert-typed");
 await expect(page.getByTestId("semantic-knowledge")).toContainText("Exigir texto exato");
 await expect(panel.getByTestId("recommendation-decision")).toContainText("Propor componente React composto");
 await expect(panel).toContainText("not-implemented (não comprova disponibilidade no contrato)");
 await expect(panel).toContainText("A recomendação não concede autorização Pi");
 await expect(panel.getByTestId("generated-code-proposal")).toBeVisible();
});

test("T29-R03 @semantic-risk: checkbox gate stays a distinct reviewable composition",async({page})=>{
 trace("T29-R03","alert-checkbox","checkbox-gating","documented-not-implemented");
 const panel=await recommendation(page,"AlertDialog","alert-checkbox");
 await expect(panel.getByTestId("recommendation-decision")).toContainText("Propor componente React composto");
 await expect(panel).toContainText("not-implemented (não comprova disponibilidade no contrato)");
 await expect(panel).toContainText("Contrato candidato precisa de aprovação humana");
 await expect(panel).toContainText("A recomendação não concede autorização Pi");
 await expect(panel.getByTestId("typed-confirmation-pilot")).toHaveCount(0);
});

test("T29-R04 @semantic-risk: remote deletion is review-only and emits no requests",async({page})=>{
 trace("T29-R04","alert-remote","confirm-signal","implemented-static-evidence");
 const panel=await recommendation(page,"AlertDialog","alert-remote");
 const remote=watched(page);
 await expect(panel.getByTestId("recommendation-decision")).toContainText("Revisão de autorização necessária");
 await expect(panel.getByTestId("recommendation-decision")).not.toContainText("· TypedConfirmationDialog");
 await expect(panel).toContainText("Nenhuma exclusão de dados pode ser concedida");
 await expect(panel.getByTestId("generated-code-proposal")).toHaveCount(0);
 await expect(panel.getByTestId("typed-confirmation-pilot")).toHaveCount(0);
 expect(remote).toEqual([]);
});

test("T29-R05 @semantic-risk: unknown and ambiguous requests fail closed",async({page})=>{
 trace("T29-R05","alert-typed");
 trace("T29-R05","alert-checkbox");
 const panel=await recommendation(page,"AlertDialog","alert-simple");
 const search=panel.getByLabel("Descrever necessidade funcional");
 await search.fill("Gerenciar pagamentos e enviar token bancário.");
 await expect(panel.getByRole("status")).toContainText("Não há correspondência segura");
 await expect(panel.getByTestId("recommendation-decision")).toHaveCount(0);
 await search.fill("Quero marcar checkbox e digitar confirmação.");
 await expect(panel.getByRole("status")).toContainText("mais de um cenário");
 await expect(panel.getByTestId("recommendation-decision")).toHaveCount(0);
 await panel.getByRole("button",{name:"Exigir confirmação digitada"}).click();
 await expect(panel.getByTestId("recommendation-decision")).toContainText("Propor componente React composto");
});

test("T29-R06 @semantic-risk: code preview is review-only, not Pi admission",async({page})=>{
 trace("T29-R06","button-copy");
 const panel=await recommendation(page,"Button","button-copy");
 const proposal=panel.getByTestId("generated-code-proposal");
 await expect(panel.getByTestId("recommendation-decision")).toContainText("Propor componente React composto");
 await expect(proposal).toBeVisible();
 await proposal.locator("summary").click();
 await expect(proposal).toContainText("Copiar não admite nem executa o componente");
 await expect(proposal).toContainText("Schema Zod proposto");
 await expect(panel).toContainText("A recomendação não concede autorização Pi");
});

test("T29-R07 @semantic-risk: catalog status requires independent certification, never a suggestion",async({page})=>{
 trace("T29-R07","alert-typed","typed-confirmation","documented-not-implemented");
 const member=official.find((item:{type:string})=>item.type==="TypedConfirmationDialog");
 const entry=entries.find((item:{type:string})=>item.type==="TypedConfirmationDialog");
 expect(member).toBeDefined();
 expect(entry).toBeDefined();
 // A later trusted certification may legitimately promote this separate type.
 if(member.lifecycle==="stable"){
  expect(member.validation.e2e).toBe("passed");
  expect(certificates.TypedConfirmationDialog?.status).toBe("passed");
  expect(certificates.TypedConfirmationDialog.sourceDigest).toBe(entry.sourceDigest);
  expect(certificates.TypedConfirmationDialog.protocol).toBe(entry.e2eProtocol);
 }else{
  expect(member.lifecycle).toBe("experimental");
 }
 await page.goto("/?screen=catalogo-pi");
 const catalog=page.getByTestId("admission-catalog");
 await catalog.getByLabel("Buscar componente").fill("TypedConfirmationDialog");
 await catalog.getByRole("button",{name:/TypedConfirmationDialog/}).click();
 const preview=catalog.getByRole("region",{name:"Prévia do contrato"});
 if(member.lifecycle==="experimental"){
  await expect(catalog.getByText(/Pi estável: não/)).toBeVisible();
  await expect(preview).toContainText("Selecione o canal experimental");
  await catalog.getByLabel("Canal Pi").selectOption("experimental");
 }else{
  await expect(catalog.getByText(/Pi estável: sim/)).toBeVisible();
  await expect(catalog.getByText("E2E aprovado").first()).toBeVisible();
 }
 await expect(preview.getByRole("button",{name:"Excluir"})).toBeVisible();
});

test("T29-R08 @semantic-risk: exact text gate and cancel stay local without deletion",async({page})=>{
 trace("T29-R08","alert-typed","typed-confirmation","documented-not-implemented");
 const panel=await recommendation(page,"AlertDialog","alert-typed");
 const remote=watched(page);
 const pilot=panel.getByTestId("typed-confirmation-pilot");
 await pilot.getByRole("button",{name:"Simular exclusão"}).click();
 const dialog=page.locator('[data-slot="alert-dialog-content"]');
 const input=dialog.getByRole("textbox",{name:/Digite exatamente:/});
 const confirm=dialog.getByRole("button",{name:"Confirmar"});
 await expect(confirm).toBeDisabled();
 await input.fill("EXCLUI");
 await expect(confirm).toBeDisabled();
 await input.fill("EXCLUIR");
 await expect(confirm).toBeEnabled();
 await dialog.getByRole("button",{name:"Cancelar"}).click();
 await expect(dialog).toBeHidden();
 await expect(pilot.getByTestId("typed-confirmation-confirmations")).toContainText("Confirmações locais: 0");
 expect(remote).toEqual([]);
});

test("T29-R09 @semantic-risk: approved Accordion reuse is not a React candidate",async({page})=>{
 trace("T29-R09","accordion-faq");
 trace("T29-R09","accordion-members");
 const panel=await recommendation(page,"Accordion","accordion-faq");
 const select=panel.getByLabel("Situação funcional");
 await expect(panel.getByTestId("recommendation-decision")).toContainText("Reutilizar contrato aprovado");
 await select.selectOption("accordion-members");
 await expect(panel.getByTestId("recommendation-decision")).toContainText("Propor componente React composto");
 await expect(panel).toContainText("A recomendação não concede autorização Pi");
});
