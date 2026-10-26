import {test,expect} from "@playwright/test"

/** Regression: semantic ReUI deep links must render without schema errors. */
for (const id of ["c-rating-6", "c-accordion-11"]) {
  test(`deep link ReUI ${id} renders the composite detail`,async({page})=>{
    const errors:string[]=[]
    page.on("pageerror",err=>errors.push(err.message))
    await page.goto("/?screen=explorador-compostos&reui="+id)
    await expect(page.getByRole("tab",{name:"Composições ReUI (559)"})).toBeVisible()
    await expect(page.getByTestId("reui-composite-details")).toBeVisible()
    await expect(page.getByTestId("reui-composite-option-"+id)).toBeVisible()
    expect(errors).toEqual([])
  })
}

test("ReUI slider exposes an accessible keyboard-operable thumb",async({page})=>{
  await page.goto("/?screen=reui")
  await page.getByLabel("Filtrar componente").selectOption("Slider")
  const host=page.getByTestId("reui-preview-c-slider-1")
  await expect(host).toBeVisible()
  await expect(host).not.toContainText("Carregando exemplo…")
  const thumb=host.getByRole("slider")
  await expect(thumb).toBeVisible()
  const before=await thumb.getAttribute("aria-valuenow")
  await thumb.focus()
  await page.keyboard.press("ArrowRight")
  await expect(thumb).not.toHaveAttribute("aria-valuenow",before??"")
})
