import {test,expect} from "@playwright/test"

/** A deep link must open the intended ReUI pattern, without a blank app or JS errors. */
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
