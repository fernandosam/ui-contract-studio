import {test,expect} from "@playwright/test";
import {mkdirSync,writeFileSync} from "node:fs";
import {execFileSync} from "node:child_process";
import {join} from "node:path";
import {createHash} from "node:crypto";
import {patternSnapshot,type PatternBrowserEvidence} from "../../src/ui-requirements/browser-evidence";

test.afterEach(async({page},info)=>{
 const name="T34 pattern preview renders: ";
 if(!info.title.startsWith(name))return;
 const pattern=info.title.slice(name.length);
 const project=info.project.name;
 const dir=join("reports/requirements/browser-evidence",project);
 mkdirSync(dir,{recursive:true});
 const png=await page.screenshot({path:join(dir,pattern+".png"),fullPage:true,animations:"disabled"});
 const snapshot=patternSnapshot(pattern);
 const sourceRevision=process.env.GITHUB_SHA??execFileSync("git",["rev-parse","HEAD"],{encoding:"utf8"}).trim();
 const record:PatternBrowserEvidence={
  schemaVersion:1,sourceRevision,runId:process.env.GITHUB_RUN_ID??"0",
  pattern,project,caseId:"preview-renders",...snapshot,
  status:info.status,expectedStatus:info.expectedStatus,
  screenshotSha256:createHash("sha256").update(png).digest("hex"),
  errors:info.errors.map(e=>e.message??"unknown")
 };
 writeFileSync(join(dir,pattern+".json"),JSON.stringify(record,null,2)+"\n");
});


for(const pattern of ["login","search","list","dashboard"]){
 test("T34 pattern preview renders: "+pattern,async({page})=>{
  await page.goto("/?screen=criador-padroes");
  const wizard=page.getByTestId("pattern-wizard");
  await expect(wizard).toBeVisible();
  await wizard.getByLabel("Tipo de tela").selectOption(pattern);
  await wizard.getByRole("button",{name:"Gerar interface do padrão"}).click();
  await expect(wizard.getByTestId("pattern-preview")).toBeVisible();
  const trace=wizard.getByTestId("pattern-traceability");
  await expect(trace).toBeVisible();
  await trace.locator("summary").click();
  await expect(trace.getByText(/Interações ainda dependem de testes independentes/)).toBeVisible();
  await expect(wizard.getByText("A interface foi bloqueada: especificação não autorizada.")).toHaveCount(0);
 });
}
test("T34 alternate dashboard and login choices remain valid",async({page})=>{
 await page.goto("/?screen=criador-padroes");
 const wizard=page.getByTestId("pattern-wizard");
 await wizard.getByLabel("Tipo de tela").selectOption("dashboard");
 await wizard.getByLabel("Quais indicadores apresentar?").selectOption("graphs");
 await expect(wizard.getByLabel("Quantidade de indicadores?")).toHaveCount(0);
 await wizard.getByRole("button",{name:"Gerar interface do padrão"}).click();
 await expect(wizard.getByTestId("pattern-preview")).toBeVisible();
 await wizard.getByLabel("Tipo de tela").selectOption("login");
 await wizard.getByLabel("Identificação").selectOption("username");
 await wizard.getByRole("button",{name:"Gerar interface do padrão"}).click();
 await expect(wizard.getByTestId("pattern-preview")).toBeVisible();
});
