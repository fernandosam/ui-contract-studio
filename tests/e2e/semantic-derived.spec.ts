import {test,expect,type Page} from "@playwright/test";
import {createHash} from "node:crypto";
import {mkdirSync,readFileSync,writeFileSync} from "node:fs";
import {join} from "node:path";
import {
  buildSemanticTestAutomation,loadSemanticTestRecords,semanticTestRecipes,
} from "../../scripts/lib/semantic-test-automation.mjs";

// Cases are discovered at load time from curated semantic knowledge. This suite
// never generates TS/JS from descriptions or executes unreviewed code.
const audit=buildSemanticTestAutomation(loadSemanticTestRecords());
if(audit.errors.length)throw new Error("Invalid semantic test recipes: "+audit.errors.join("; "));
const registered=audit.entries.filter(item=>item.status==="registered");

async function preview(page:Page,component:string) {
  await page.goto("/?screen=explorador-primitivos");
  await page.getByRole("button",{name:component,exact:true}).first().click();
  const container=page.getByTestId("catalog-live-preview");
  await expect(container).toBeVisible();
  return container;
}
function networkRequests(page:Page) {
  const requests:string[]=[];
  page.on("request",request=>{
    if(["xhr","fetch"].includes(request.resourceType()))requests.push(request.url());
  });
  return requests;
}
const recipes:Record<string,(page:Page)=>Promise<void>>={
  "dialog.cancel-without-confirm":async page=>{
    const container=await preview(page,"AlertDialog");
    const remote=networkRequests(page);
    const trigger=container.getByRole("button",{name:"Confirmar operação"});
    await trigger.click();
    const dialog=page.locator('[data-slot="alert-dialog-content"]');
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button",{name:"Cancelar"}).click();
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
    expect(remote).toEqual([]);
    // Event counts are not exposed by this explorer. The semantic report marks
    // this as partial, not as proof of zero "confirm" emissions.
  },
  "button.press-disabled":async page=>{
    const container=await preview(page,"Button");
    const remote=networkRequests(page);
    const button=container.getByRole("button",{name:"Testar ação local"});
    await expect(button).toBeEnabled();
    await button.click();
    await page.locator("#property-Button-disabled").selectOption("true");
    await expect(button).toBeDisabled();
    await page.locator("#property-Button-disabled").selectOption("false");
    await page.locator("#property-Button-loading").selectOption("true");
    await expect(button).toBeDisabled();
    await expect(button).toHaveAttribute("aria-busy","true");
    await expect(button.locator("svg.animate-spin")).toBeVisible();
    await page.locator("#property-Button-loading").selectOption("false");
    await expect(button).toBeEnabled();
    await button.focus();
    await page.keyboard.press("Enter");
    expect(remote).toEqual([]);
    // Press event counts are not observable here; this is partial coverage.
  },
  "accordion.single-multiple":async page=>{
    const container=await preview(page,"Accordion");
    const first=container.getByRole("button",{name:"O que é um catálogo fechado?"});
    const second=container.getByRole("button",{name:"E se faltar algum tipo?"});
    await first.click();
    await expect(first).toHaveAttribute("aria-expanded","true");
    await second.click();
    await expect(first).toHaveAttribute("aria-expanded","false");
    await expect(second).toHaveAttribute("aria-expanded","true");
    await page.locator("#property-Accordion-type").selectOption("multiple");
    await first.click();
    await expect(first).toHaveAttribute("aria-expanded","true");
    await expect(second).toHaveAttribute("aria-expanded","true");
  },
};
for(const entry of registered) {
  if(!(entry.recipe in semanticTestRecipes)||!recipes[entry.recipe!])
    throw new Error("No reviewed Playwright implementation for "+entry.component+"/"+entry.id);
}

test.afterEach(async({page},info)=>{
  const entry=registered.find(item=>info.title==="semantic: "+item.component+"/"+item.id);
  if(!entry)return;
  const directory=join("reports/semantic-tests",info.project.name);
  mkdirSync(directory,{recursive:true});
  const digest=createHash("sha256").update(readFileSync(entry.source)).digest("hex");
  writeFileSync(join(directory,entry.component+"-"+entry.id+".json"),JSON.stringify({
    schemaVersion:1,component:entry.component,testId:entry.id,
    recipe:entry.recipe,source:entry.source,sourceSha256:digest,
    capabilities:entry.capabilities,coverage:entry.coverage,
    sourceRevision:process.env.GITHUB_SHA??null,
    project:info.project.name,pageUrl:page.url(),status:info.status,expectedStatus:info.expectedStatus,
    retry:info.retry,errors:info.errors.map(error=>error.message??"unknown"),
    certification:"not-granted",
  },null,2)+"\n");
});

for(const entry of registered) {
  test("semantic: "+entry.component+"/"+entry.id,async({page})=>{
    await recipes[entry.recipe!](page);
  });
}
