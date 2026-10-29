import {test,expect,type Page} from "@playwright/test";
import {readFileSync} from "node:fs";

// T32 — tests the existing approved AlertDialog implementation, not a candidate.
// These assertions are runtime evidence only, never automatic Pi certification.
const knowledge=JSON.parse(readFileSync("src/ui-catalog/knowledge/alert-dialog.json","utf8"));
const required=["controlled-open","confirm-signal","explicit-cancel",
  "destructive-variant","small-size-footer","focus-and-keyboard","mobile-dialog"];
for(const id of required){
 if(!knowledge.capabilities.some((item:{id:string})=>item.id===id))
  throw new Error("T32 semantic knowledge is missing capability "+id);
}
async function preview(page:Page){
 await page.goto("/?screen=explorador-primitivos");
 await page.getByLabel("Componentes registrados").getByRole("button",{name:/AlertDialog/}).click();
 const container=page.getByTestId("catalog-live-preview");
 await expect(container).toBeVisible();
 const trigger=container.getByRole("button",{name:"Confirmar operação"});
 await expect(trigger).toBeVisible();
 return {container,trigger};
}
const popup=(page:Page)=>page.locator('[data-slot="alert-dialog-content"]');

test("T32 AlertDialog: keyboard open, Escape and trigger focus restoration",async({page})=>{
 const {trigger}=await preview(page);
 await trigger.focus();
 await page.keyboard.press("Enter");
 const dialog=popup(page);
 await expect(dialog).toBeVisible();
 await expect(dialog.getByText("Deseja continuar?")).toBeVisible();
 await expect(dialog.getByText("Confira os detalhes antes de confirmar.")).toBeVisible();
 await page.keyboard.press("Escape");
 await expect(dialog).toBeHidden();
 await expect(trigger).toBeFocused();
});

test("T32 AlertDialog: explicit cancel does not confirm; confirm closes without remote calls",async({page})=>{
 const {trigger}=await preview(page);
 const remote:string[]=[];
 page.on("request",request=>{
  if(["xhr","fetch"].includes(request.resourceType()))remote.push(request.url());
 });
 await trigger.click();
 const dialog=popup(page);
 await expect(dialog).toBeVisible();
 await dialog.getByRole("button",{name:"Cancelar"}).click();
 await expect(dialog).toBeHidden();
 await expect(trigger).toBeFocused();
 await trigger.click();
 await expect(dialog).toBeVisible();
 await dialog.getByRole("button",{name:"Continuar"}).click();
 await expect(dialog).toBeHidden();
 expect(remote).toEqual([]);
});

test("T32 AlertDialog: small destructive variant stays within desktop/mobile viewport",async({page})=>{
 await preview(page);
 await page.locator("#property-AlertDialog-size").selectOption("sm");
 await page.locator("#property-AlertDialog-confirmVariant").selectOption("destructive");
 const trigger=page.getByTestId("catalog-live-preview").getByRole("button",{name:"Confirmar operação"});
 await trigger.click();
 const dialog=popup(page);
 await expect(dialog).toBeVisible();
 await expect(dialog.locator('[data-slot="alert-dialog-cancel"]')).toBeVisible();
 await expect(dialog.locator('[data-slot="alert-dialog-action"]')).toBeVisible();
 const rect=await dialog.boundingBox();
 const viewport=page.viewportSize();
 expect(rect).not.toBeNull();
 expect(viewport).not.toBeNull();
 expect(rect!.x).toBeGreaterThanOrEqual(-1);
 expect(rect!.x+rect!.width).toBeLessThanOrEqual(viewport!.width+1);
 expect(rect!.y).toBeGreaterThanOrEqual(-1);
 expect(rect!.y+rect!.height).toBeLessThanOrEqual(viewport!.height+1);
 await dialog.getByRole("button",{name:"Cancelar"}).click();
 await expect(dialog).toBeHidden();
});
