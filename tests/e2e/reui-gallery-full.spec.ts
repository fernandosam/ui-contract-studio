import {test, expect} from "@playwright/test";
import {readFileSync} from "node:fs";

type Guide={examples:[string,string][]};
const guides=JSON.parse(readFileSync("src/ui-catalog/reui-guidance.json","utf8")) as Record<string,Guide>;

/** Execução exclusiva do workflow E2E manual na main: cada família exercita TODAS as prévias. */
test.describe("ReUI — prévias reais, sem fallback obsoleto",()=>{
 for(const [kind,guide] of Object.entries(guides)){
  test(`${kind}: renderizar os ${guide.examples.length} exemplos sob demanda`,async({page})=>{
   test.setTimeout(180_000);
   const pageErrors:string[]=[];
   page.on("pageerror",error=>pageErrors.push(error.message));
   await page.goto("/?screen=reui");
   await expect(page.getByRole("heading",{name:"ReUI",level:1})).toBeVisible();
   await page.getByLabel("Filtrar componente").selectOption(kind);
   await page.getByLabel("Pesquisar exemplos").fill("");
   const selector=kind==="Accordion"?"[data-reui-accordion-example]":kind==="Button"?"[data-reui-button-example]":kind==="Separator"?"[data-reui-separator-example]":"[data-reui-example]";
   for(let start=0;start<guide.examples.length;start+=12){
    if(start>0)await page.getByRole("button",{name:"Carregar mais 12 exemplos"}).click();
    const end=Math.min(start+12,guide.examples.length);
    await expect(page.locator('[data-testid^="reui-preview-"]')).toHaveCount(end);
    for(const [,id] of guide.examples.slice(start,end)){
     const preview=page.getByTestId(`reui-preview-${id}`);
     await expect(preview.locator(selector)).toBeVisible();
     await expect(preview).not.toContainText("Prévia local ainda não implementada");
     await expect(preview).not.toContainText("Carregando exemplo…");
    }
   }
   expect(pageErrors,`${kind}: erros de renderização no navegador`).toEqual([]);
  });
 }
});
