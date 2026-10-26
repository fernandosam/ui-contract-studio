import {test,expect, type Page} from "@playwright/test";
import {mkdirSync,writeFileSync} from "node:fs";
import {join} from "node:path";
import entries from "../../src/ui-catalog/admission-engine/entries.json";
import protocols from "../../src/ui-catalog/admission-engine/protocols.json";

type CandidateId="alert-checkbox"|"accordion-members"|"button-copy";
type ClipboardWindow=Window&{__admissionCopies?:string[]};
const selected = ["alert-checkbox","accordion-members","button-copy"] as const;
const byId=new Map(entries.entries.map(entry=>[entry.id,entry]));

async function openCatalog(page:Page,id:CandidateId) {
 const entry=byId.get(id);
 if(!entry)throw new Error("Candidate not registered: "+id);
 await page.goto("/?screen=catalogo-pi");
 const catalog=page.getByTestId("admission-catalog");
 await expect(catalog).toBeVisible();
 await catalog.getByLabel("Maturidade").selectOption("experimental");
 await catalog.getByRole("button",{name:new RegExp(entry.type)}).click();
 await expect(catalog.getByText(/Este componente ainda não passou pelo E2E completo/)).toBeVisible();
 await catalog.getByLabel("Canal Pi").selectOption("experimental");
 const preview=catalog.getByRole("region",{name:"Prévia do contrato"});
 await expect(preview).toBeVisible();
 return preview;
}
function monitorRequests(page:Page) {
 const requests:string[]=[];
 page.on("request",request=>{
  if(["xhr","fetch"].includes(request.resourceType()))requests.push(request.url());
 });
 return requests;
}
async function setClipboard(page:Page,ok:boolean) {
 await page.addInitScript(({allowed})=>{
  const w=window as ClipboardWindow;
  w.__admissionCopies=[];
  Object.defineProperty(navigator,"clipboard",{configurable:true,value:{
   writeText:async(text:string)=>{
    if(!allowed)throw new Error("clipboard-denied");
    w.__admissionCopies?.push(text);
   }
  }});
 },{allowed:ok});
}
async function copied(page:Page):Promise<string[]> {
 return page.evaluate(()=>(window as ClipboardWindow).__admissionCopies??[]);
}
test.afterEach(async({page},info)=>{
 const group=info.titlePath().find(value=>value.startsWith("candidate:"));
 const id=group?.slice("candidate:".length) as CandidateId|undefined;
 if(!id || !selected.includes(id))return;
 const protocol=protocols.candidates[id];
 const caseId=info.title.split(" :: ")[0];
 if(!protocol.cases.includes(caseId as never))return;
 const dir=join(protocol.evidenceRoot,info.project.name);
 mkdirSync(dir,{recursive:true});
 let screenshotStatus="unavailable";
 try {
  await page.screenshot({path:join(dir,caseId+".png"),animations:"disabled",fullPage:true});
  screenshotStatus=info.status==="passed"?"captured":"captured-failure";
 }catch{/* failure remains unavailable and will be rejected by evidence verification */}
 writeFileSync(join(dir,caseId+".json"),JSON.stringify({
  schemaVersion:1,scenarioId:id,target:protocol.target,
  sourceDigest:byId.get(id)?.sourceDigest,
  protocol:protocol.protocol,project:info.project.name,caseId,
  status:info.status,expectedStatus:info.expectedStatus,retry:info.retry,
  screenshotStatus,errors:info.errors.map(error=>error.message??"unknown")
 },null,2)+"\n");
});

test.describe("candidate:alert-checkbox",()=>{
 test("confirmation-gate :: unchecked confirmation is disabled and explicit acknowledgment enables it",async({page})=>{
  const preview=await openCatalog(page,"alert-checkbox");
  const requests=monitorRequests(page);
  await preview.getByRole("button",{name:"Excluir"}).click();
  const dialog=page.locator('[data-slot="alert-dialog-content"]');
  await expect(dialog).toBeVisible();
  const confirm=dialog.getByRole("button",{name:"Excluir"});
  await expect(confirm).toBeDisabled();
  await dialog.getByRole("checkbox").click();
  await expect(confirm).toBeEnabled();
  await confirm.click();
  await expect(dialog).toBeHidden();
  expect(requests).toEqual([]);
 });
 test("cancel-reset :: cancel and reopen never retains the acknowledgment",async({page})=>{
  const preview=await openCatalog(page,"alert-checkbox");
  await preview.getByRole("button",{name:"Excluir"}).click();
  const dialog=page.locator('[data-slot="alert-dialog-content"]');
  await dialog.getByRole("checkbox").click();
  await expect(dialog.getByRole("button",{name:"Excluir"})).toBeEnabled();
  await dialog.getByRole("button",{name:"Cancelar"}).click();
  await expect(dialog).toBeHidden();
  await preview.getByRole("button",{name:"Excluir"}).click();
  await expect(dialog.getByRole("checkbox")).not.toBeChecked();
  await expect(dialog.getByRole("button",{name:"Excluir"})).toBeDisabled();
 });
 test("keyboard-local-only :: keyboard activation and Escape restore focus without external effects",async({page})=>{
  const preview=await openCatalog(page,"alert-checkbox");
  const requests=monitorRequests(page);
  const trigger=preview.getByRole("button",{name:"Excluir"});
  await trigger.focus();
  await page.keyboard.press("Enter");
  const dialog=page.locator('[data-slot="alert-dialog-content"]');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("checkbox")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
  expect(requests).toEqual([]);
 });
});
test.describe("candidate:accordion-members",()=>{
 test("members-content :: renders member identity without remote avatars",async({page})=>{
  const preview=await openCatalog(page,"accordion-members");
  const requests=monitorRequests(page);
  await expect(preview.getByText("Ana")).toBeVisible();
  await expect(preview.getByText("Engenheira")).toBeVisible();
  await expect(preview.locator("img[src^='http']")).toHaveCount(0);
  expect(requests).toEqual([]);
 });
 test("keyboard-toggle :: Enter opens local description then closes it",async({page})=>{
  const preview=await openCatalog(page,"accordion-members");
  const trigger=preview.getByRole("button",{name:/Ana/});
  await trigger.focus();
  await page.keyboard.press("Enter");
  await expect(trigger).toHaveAttribute("aria-expanded","true");
  await expect(preview.getByText("Membro",{exact:true})).toBeVisible();
  await page.keyboard.press("Enter");
  await expect(trigger).toHaveAttribute("aria-expanded","false");
 });
 test("responsive-local-only :: content fits viewport without fetch or navigation",async({page})=>{
  const preview=await openCatalog(page,"accordion-members");
  const requests=monitorRequests(page);
  const trigger=preview.getByRole("button",{name:/Ana/});
  await trigger.click();
  const bounds=await trigger.boundingBox();
  const viewport=page.viewportSize();
  expect(bounds).not.toBeNull();
  expect(viewport).not.toBeNull();
  expect(bounds!.x).toBeGreaterThanOrEqual(-1);
  expect(bounds!.x+bounds!.width).toBeLessThanOrEqual(viewport!.width+1);
  await expect(preview.getByText("Membro",{exact:true})).toBeVisible();
  expect(requests).toEqual([]);
 });
});
test.describe("candidate:button-copy",()=>{
 test("copy-success :: writes exactly once only after explicit click",async({page})=>{
  await setClipboard(page,true);
  const preview=await openCatalog(page,"button-copy");
  const requests=monitorRequests(page);
  expect(await copied(page)).toEqual([]);
  await preview.getByRole("button",{name:"Copiar"}).click();
  await expect(preview.getByRole("status")).toHaveText("Copiado");
  expect(await copied(page)).toEqual(["texto seguro"]);
  expect(requests).toEqual([]);
 });
 test("clipboard-denied :: failure is announced without remote fallback",async({page})=>{
  await setClipboard(page,false);
  const preview=await openCatalog(page,"button-copy");
  const requests=monitorRequests(page);
  await preview.getByRole("button",{name:"Copiar"}).click();
  await expect(preview.getByRole("status")).toContainText("Não foi possível copiar");
  expect(await copied(page)).toEqual([]);
  expect(requests).toEqual([]);
 });
 test("keyboard-local-only :: Enter invokes local clipboard with accessible feedback",async({page})=>{
  await setClipboard(page,true);
  const preview=await openCatalog(page,"button-copy");
  const button=preview.getByRole("button",{name:"Copiar"});
  await button.focus();
  await page.keyboard.press("Enter");
  await expect(preview.getByRole("status")).toHaveText("Copiado");
  expect(await copied(page)).toEqual(["texto seguro"]);
 });
});
