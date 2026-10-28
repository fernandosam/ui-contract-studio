import {test,expect,type Page} from "@playwright/test";

// T32 — runtime evidence. Never promote candidate capabilities or Pi permissions.
async function preview(page:Page,family:"Button"|"Accordion"){
 await page.goto("/?screen=explorador-primitivos");
 await page.getByRole("button",{name:family,exact:true}).first().click();
 const container=page.getByTestId("catalog-live-preview");
 await expect(container).toBeVisible();
 return container;
}
const watchNetwork=(page:Page)=>{
 const requests:string[]=[];
 page.on("request",r=>{if(["fetch","xhr"].includes(r.resourceType()))requests.push(r.url());});
 return requests;
};

test("T32 Button: loading announces pending, blocks press and restores interaction",async({page})=>{
 const container=await preview(page,"Button");
 const outbound=watchNetwork(page);
 const button=container.getByRole("button",{name:"Testar ação local"});
 await expect(button).toBeEnabled();
 await page.locator("#property-Button-loading").selectOption("true");
 await expect(button).toBeDisabled();
 await expect(button).toHaveAttribute("aria-busy","true");
 await expect(button.locator("svg.animate-spin")).toBeVisible();
 await page.locator("#property-Button-loading").selectOption("false");
 await expect(button).toBeEnabled();
 await expect(button).not.toHaveAttribute("aria-busy","true");
 await button.focus();
 await page.keyboard.press("Enter");
 await expect(button).toBeEnabled();
 expect(outbound).toEqual([]);
});

test("T32 Accordion: keyboard single expansion changes aria-expanded and collapses first item",async({page})=>{
 const container=await preview(page,"Accordion");
 const first=container.getByRole("button",{name:"O que é um catálogo fechado?"});
 const second=container.getByRole("button",{name:"E se faltar algum tipo?"});
 await first.focus();
 await page.keyboard.press("Enter");
 await expect(first).toHaveAttribute("aria-expanded","true");
 await expect(container.getByText("As telas usam somente tipos e propriedades conhecidos.")).toBeVisible();
 await second.click();
 await expect(second).toHaveAttribute("aria-expanded","true");
 await expect(first).toHaveAttribute("aria-expanded","false");
});

test("T32 Accordion: long title and content stay within mobile/desktop viewport",async({page})=>{
 const container=await preview(page,"Accordion");
 const text="Uma pergunta com uma palavra extremamentecompridaextremamentecompridaextremamentecompridaextremamentecomprida para testar o layout";
 const items=[{title:text,value:"long-faq",content:"Conteúdo extenso sobre navegação, confirmação e acessibilidade.".repeat(8)}];
 await page.locator("#property-Accordion-items").fill(JSON.stringify(items));
 const trigger=container.getByRole("button",{name:text});
 await expect(trigger).toBeVisible();
 const rect=await trigger.boundingBox(),viewport=page.viewportSize();
 expect(rect).not.toBeNull();
 expect(viewport).not.toBeNull();
 expect(rect!.x).toBeGreaterThanOrEqual(-1);
 expect(rect!.x+rect!.width).toBeLessThanOrEqual(viewport!.width+1);
 await trigger.click();
 await expect(trigger).toHaveAttribute("aria-expanded","true");
 const panel=container.getByText(/Conteúdo extenso sobre navegação/);
 await expect(panel).toBeVisible();
});
