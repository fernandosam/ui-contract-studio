import {test,expect} from "@playwright/test";
import {mkdirSync,writeFileSync} from "node:fs";
import {join} from "node:path";

type Flow="registration"|"login"|"search"|"dashboard";
const flows:Flow[]=["registration","login","search","dashboard"];

async function openPreview(page:import("@playwright/test").Page,flow:Flow){
 if(flow==="registration"){
  await page.goto("/?screen=criador-interfaces");
  const wizard=page.getByTestId("requirements-wizard");
  await wizard.getByLabel("O cadastro será demonstrativo ou salvará no servidor?").selectOption("local-demo");
  await wizard.getByRole("button",{name:"Gerar prévia JSON"}).click();
  return wizard.getByTestId("generated-preview");
 }
 await page.goto("/?screen=criador-padroes");
 const wizard=page.getByTestId("pattern-wizard");
 await wizard.getByLabel("Tipo de tela").selectOption(flow);
 await wizard.getByRole("button",{name:"Gerar interface do padrão"}).click();
 return wizard.getByTestId("pattern-preview");
}
for(const flow of flows){
 test("layout browser geometry is reported without admitting contracts: "+flow,async({page},info)=>{
  const preview=await openPreview(page,flow);
  await expect(preview).toBeVisible();
  const panel=preview.getByTestId("layout-runtime-quality");
  await expect(panel).toBeVisible();
  const evidence=JSON.parse((await panel.getAttribute("data-runtime-report"))??"null");
  expect(evidence).toBeTruthy();
  expect(evidence).toMatchObject({
   schemaVersion:1,basis:"browser-geometry",runtimeEvidence:"browser-measured",policy:"advisory-only",
   maxScore:100
  });
  expect(evidence.viewport.width).toBe(page.viewportSize()?.width);
  expect(evidence.viewport.surfaceWidth).toBeGreaterThan(0);
  expect(evidence.checks.evaluated).toBeGreaterThan(0);
  expect(evidence.score).toBeGreaterThanOrEqual(0);
  expect(evidence.score).toBeLessThanOrEqual(100);
  expect(evidence.scores).toEqual({
   hierarchy:expect.any(Number),grouping:expect.any(Number),
   density:expect.any(Number),responsiveness:expect.any(Number)
  });
  expect(evidence.score).toBe(Object.values(evidence.scores as Record<string,number>).reduce((a,b)=>a+b,0));
  await expect(preview.getByTestId("layout-quality")).toContainText("Qualidade estimada do layout");
  await expect(preview.getByText("A interface foi bloqueada: especificação não autorizada.")).toHaveCount(0);
  const path=join(process.cwd(),"reports","layout-runtime",info.project.name);
  mkdirSync(path,{recursive:true});
  writeFileSync(join(path,flow+".json"),JSON.stringify({
   flow,project:info.project.name,sourceRevision:process.env.GITHUB_SHA??null,
   ...evidence
  },null,2)+"\n");
 });
}
test("real measured overflow decreases only advisory browser score",async({page})=>{
 const preview=await openPreview(page,"login");
 const panel=preview.getByTestId("layout-runtime-quality");
 await expect(panel).toBeVisible();
 const initial=Number(await panel.getAttribute("data-runtime-score"));
 expect(Number.isFinite(initial)).toBe(true);
 await preview.getByTestId("layout-quality-surface").evaluate(surface=>{
  const fault=document.createElement("div");
  fault.dataset.testid="injected-overflow";
  fault.style.width="3000px";
  fault.style.height="1px";
  surface.appendChild(fault);
  window.dispatchEvent(new Event("resize"));
 });
 await expect.poll(async()=>Number(await panel.getAttribute("data-runtime-score"))).toBeLessThan(initial);
 const report=JSON.parse((await panel.getAttribute("data-runtime-report"))??"null");
 expect(report.findings.some((item:{code:string})=>item.code==="browser-horizontal-overflow")).toBe(true);
 await expect(preview.getByText("A interface foi bloqueada: especificação não autorizada.")).toHaveCount(0);
});
