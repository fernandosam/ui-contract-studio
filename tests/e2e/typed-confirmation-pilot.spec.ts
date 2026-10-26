import {test,expect} from "@playwright/test";
import {mkdirSync,writeFileSync,readFileSync} from "node:fs";
const typedEntry=JSON.parse(readFileSync("src/ui-catalog/admission-engine/entries.json","utf8")).entries.find((entry:{id:string})=>entry.id==="alert-typed");
const typedProtocol=JSON.parse(readFileSync("src/ui-catalog/admission-engine/protocols.json","utf8")).candidates["alert-typed"];
import {join} from "node:path";

const ids=["invalid-and-exact-match","cancel-and-reopen","keyboard-focus","responsive-layout","schema-and-no-network"];
const root="reports/composition-validation/typed-confirmation";
const load=async page=>{
 await page.goto("/?screen=explorador-primitivos");
 await page.getByRole("button",{name:"AlertDialog",exact:true}).first().click();
 const panel=page.getByTestId("composition-recommendations");
 await expect(panel).toBeVisible();
 await panel.getByLabel("Situação funcional").selectOption("alert-typed");
 const pilot=page.getByTestId("typed-confirmation-pilot");
 await expect(pilot).toBeVisible();
 return pilot;
};
const open=async(page,pilot)=>{
 await pilot.getByRole("button",{name:"Simular exclusão"}).click();
 const dialog=page.locator('[data-slot="alert-dialog-content"]');
 await expect(dialog).toBeVisible();
 return dialog;
};
const snapshot=async(page,info,id)=>{
 const dir=join(root,info.project.name);
 mkdirSync(dir,{recursive:true});
 await page.screenshot({path:join(dir,id+".png"),animations:"disabled",fullPage:true});
};
test.afterEach(async({page},info)=>{
 const id=info.title.split(" :: ")[0];
 if(!ids.includes(id))return;
 const dir=join(root,info.project.name);
 mkdirSync(dir,{recursive:true});
 let screenshotStatus="unavailable";
 if(info.status!=="passed"){
  try{await snapshot(page,info,id);screenshotStatus="captured-failure";}catch{ /* best effort on closed page */ }
 }else{
  try{await snapshot(page,info,id);screenshotStatus="captured";}catch{/* evidence report will reject missing screenshots */}
 }
 writeFileSync(join(dir,id+".json"),JSON.stringify({
  schemaVersion:1,scenarioId:"alert-typed",caseId:id,
  target:typedEntry.type,sourceDigest:typedEntry.sourceDigest,protocol:typedProtocol.protocol,
  project:info.project.name,status:info.status,
  expectedStatus:info.expectedStatus,retry:info.retry,
  durationMs:info.duration,screenshotStatus,
  errors:info.errors.map(x=>x.message??"unknown failure"),
 },null,2)+"\n");
});

test("invalid-and-exact-match :: textual gate blocks invalid input and confirms exactly once",async({page},info)=>{
 const pilot=await load(page),dialog=await open(page,pilot);
 const input=dialog.getByRole("textbox",{name:/Digite exatamente:/});
 const confirm=dialog.getByRole("button",{name:"Confirmar"});
 await expect(confirm).toBeDisabled();
 await input.fill("EXCLUI");
 await expect(confirm).toBeDisabled();
 await input.fill("excluir");
 await expect(confirm).toBeDisabled();
 await input.fill(" EXCLUIR ");
 await expect(confirm).toBeDisabled();
 await input.fill("EXCLUIR");
 await expect(confirm).toBeEnabled();
 await snapshot(page,info,"dialog-open-valid");
 await confirm.click();
 await expect(dialog).toBeHidden();
 await expect(pilot.getByTestId("typed-confirmation-confirmations")).toContainText("Confirmações locais: 1");
 await expect(pilot.getByTestId("typed-confirmation-confirmations")).toContainText("Nenhuma operação externa");
 await open(page,pilot);
 await expect(page.locator('[data-slot="alert-dialog-content"] input')).toHaveValue("");
 await expect(page.locator('[data-slot="alert-dialog-content"]').getByRole("button",{name:"Confirmar"})).toBeDisabled();
});
test("cancel-and-reopen :: cancellation resets state and does not emit confirm",async({page})=>{
 const pilot=await load(page),dialog=await open(page,pilot);
 await dialog.getByRole("textbox",{name:/Digite exatamente:/}).fill("EXCLUIR");
 await dialog.getByRole("button",{name:"Cancelar"}).click();
 await expect(dialog).toBeHidden();
 await expect(pilot.getByTestId("typed-confirmation-confirmations")).toContainText("Confirmações locais: 0");
 const again=await open(page,pilot);
 await expect(again.getByRole("textbox",{name:/Digite exatamente:/})).toHaveValue("");
 await expect(again.getByRole("button",{name:"Confirmar"})).toBeDisabled();
});
test("keyboard-focus :: semantic labels, Escape, Tab and trigger focus restoration",async({page})=>{
 const pilot=await load(page);
 const trigger=pilot.getByRole("button",{name:"Simular exclusão"});
 await trigger.focus();
 await page.keyboard.press("Enter");
 const dialog=page.locator('[data-slot="alert-dialog-content"]');
 await expect(dialog).toBeVisible();
 await expect(dialog.getByText("Confirmação simulada")).toBeVisible();
 const input=dialog.getByRole("textbox",{name:/Digite exatamente:/});
 await input.focus();
 await expect(input).toBeFocused();
 await page.keyboard.press("Tab");
 const focused=await page.evaluate(()=>document.activeElement?.getAttribute("data-slot"));
 expect(["alert-dialog-cancel","alert-dialog-action",null]).toContain(focused);
 await page.keyboard.press("Escape");
 await expect(dialog).toBeHidden();
 await expect(trigger).toBeFocused();
});
test("responsive-layout :: dialog, field and controls fit viewport",async({page},info)=>{
 const pilot=await load(page),dialog=await open(page,pilot);
 await snapshot(page,info,"dialog-responsive");
 const viewport=page.viewportSize();
 expect(viewport).not.toBeNull();
 const bounds=await dialog.boundingBox();
 expect(bounds).not.toBeNull();
 expect(bounds!.x).toBeGreaterThanOrEqual(-1);
 expect(bounds!.x+bounds!.width).toBeLessThanOrEqual(viewport!.width+1);
 const input=dialog.getByRole("textbox",{name:/Digite exatamente:/});
 const fieldBounds=await input.boundingBox();
 expect(fieldBounds).not.toBeNull();
 expect(fieldBounds!.x).toBeGreaterThanOrEqual(bounds!.x-1);
 expect(fieldBounds!.x+fieldBounds!.width).toBeLessThanOrEqual(viewport!.width+1);
 await expect(dialog.getByRole("button",{name:"Cancelar"})).toBeVisible();
 await expect(dialog.getByRole("button",{name:"Confirmar"})).toBeVisible();
});
test("schema-and-no-network :: rejects invalid schema and emits no remote requests",async({page})=>{
 const pilot=await load(page);
 const expected=pilot.getByLabel("Texto exigido na demonstração");
 await expected.fill("");
 await expect(pilot.getByRole("alert")).toContainText("Informe de 1 a 80 caracteres");
 await expect(pilot.getByRole("button",{name:"Simular exclusão"})).toHaveCount(0);
 await expected.fill("VALIDAR");
 await expect(pilot.getByRole("alert")).toHaveCount(0);
 const external=[];
 page.on("request",request=>{
  if(["xhr","fetch"].includes(request.resourceType()))
   external.push(request.url());
 });
 const dialog=await open(page,pilot);
 const confirm=dialog.getByRole("button",{name:"Confirmar"});
 await dialog.getByRole("textbox",{name:/Digite exatamente:/}).fill("EXCLUIR");
 await expect(confirm).toBeDisabled();
 await dialog.getByRole("textbox",{name:/Digite exatamente:/}).fill("VALIDAR");
 await confirm.click();
 await expect(dialog).toBeHidden();
 await expect(pilot.getByTestId("typed-confirmation-confirmations")).toContainText("Confirmações locais: 1");
 expect(external).toEqual([]);
});
