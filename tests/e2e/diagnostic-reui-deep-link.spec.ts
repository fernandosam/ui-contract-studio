import {test,expect} from "@playwright/test"

/** Diagnostic assertions remain meaningful; failures include page state for triage. */
for (const id of ["c-rating-6", "c-accordion-11"]) {
  test(`deep link ReUI ${id} renders the composite detail`,async({page})=>{
    const errors:string[]=[]
    page.on("pageerror",err=>{errors.push(err.message); console.log("[pageerror]",id,err.message)})
    page.on("console",msg=>{if(msg.type()==="error")console.log("[console.error]",id,msg.text())})
    await page.goto("/?screen=explorador-compostos&reui="+id)
    await page.waitForTimeout(900)
    console.log("[diagnostic]",id,"url",page.url(),"body",(await page.locator("body").innerText()).slice(0,1500))
    await expect(page.getByRole("tab",{name:"Composições ReUI (559)"})).toBeVisible()
    await expect(page.getByTestId("reui-composite-details")).toBeVisible()
    await expect(page.getByTestId("reui-composite-option-"+id)).toBeVisible()
    expect(errors).toEqual([])
  })
}

test("deep link diagnostic: ReUI slider exposes a keyboard-operable thumb",async({page})=>{
  page.on("pageerror",err=>console.log("[slider pageerror]",err.message))
  await page.goto("/?screen=reui")
  await page.getByLabel("Filtrar componente").selectOption("Slider")
  const host=page.getByTestId("reui-preview-c-slider-1")
  await expect(host).toBeVisible()
  console.log("[slider HTML]",(await host.innerHTML()).slice(0,6500))
  await expect(host.getByRole("slider")).toBeVisible()
})
