import { test, expect } from '@playwright/test';

// Browser smoke tests for source-informed composites. No external actions are executed.
for (const [name, label] of [
  ['SiteCardsPaymentMethod','Plan'],
  ['SiteCardsReportIssue','Security Level'],
  ['SiteCardsTeamMembers','Team Members'],
  ['SiteThemeCustomizer','Radius'],
] as const) {
  test(`${name}: renders as an approved site composite`,async({page})=>{
    await page.goto('/?screen=explorador-compostos');
    await page.getByLabel('Buscar componente').fill(name);
    await page.getByRole('button',{name,exact:true}).click();
    await expect(page.getByTestId('catalog-live-preview')).toBeVisible();
    const preview=page.getByTestId('catalog-live-preview');
    if (name==='SiteThemeCustomizer') {
      await expect(preview.getByRole('slider')).toBeVisible();
      await expect(preview).toContainText('Radius');
    } else {
      await expect(preview.getByText(label,{exact:true}).first()).toBeVisible();
    }
    await expect(page.getByText('Componente indisponível: contrato inválido.')).toHaveCount(0);
  });
}
