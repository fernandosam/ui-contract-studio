import { auditVisualGeometry } from './visual-geometry';
import { test, expect, type Locator, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';

type Preview = { screen: string; cards: Array<{ id: string; representation: string; inlineRoot?: string }> };
const previews = (JSON.parse(readFileSync('src/ui-catalog/create-preview-inventory.json', 'utf8')) as { previews: Preview[] }).previews;
const manifests = Object.fromEntries(previews.map(group => [
  group.screen,
  JSON.parse(readFileSync(`src/ui-screens/${group.screen}.json`, 'utf8')) as {
    elements: Record<string, { props?: { title?: string } }>
  },
]));

function resolveCard(page: Page, group: Preview, card: Preview['cards'][number]): Locator {
  if (card.representation !== 'inline-primitives') {
    return page.locator(`[data-composite="${card.id}"]`);
  }
  const title = manifests[group.screen].elements[card.inlineRoot ?? '']?.props?.title;
  if (!title) throw Error(`Inline card ${card.id} has no title`);
  return page.getByText(title, { exact: true }).locator('xpath=ancestor::*[@data-slot="card"][1]').first();
}

for (const group of previews) {
  test(`@visual-regression ${group.screen}: all cards fit viewport and remain renderable`, async ({ page }, info) => {
    const viewport = info.project.name === 'mobile'
      ? { width: 390, height: 844 }
      : { width: 1440, height: 900 };
    await page.setViewportSize(viewport);
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`/?screen=${group.screen}`);
    await expect(page.locator('main[role="alert"]')).toHaveCount(0);
    for (const card of group.cards) {
      const item = resolveCard(page, group, card);
      await expect(item, card.id).toBeVisible();
      await item.scrollIntoViewIfNeeded();
      await auditVisualGeometry(item, card.id);
      const box = await item.boundingBox();
      expect(box, `${card.id}: missing geometry`).not.toBeNull();
      expect(box!.width, `${card.id}: collapsed`).toBeGreaterThan(80);
      expect(box!.x, `${card.id}: left overflow`).toBeGreaterThanOrEqual(-2);
      expect(box!.x + box!.width, `${card.id}: right overflow`).toBeLessThanOrEqual(viewport.width + 2);
      await expect(item).not.toContainText('Componente indisponível');
      // Nested primitives must not introduce horizontal overflow outside the card.
      const overflow = await item.evaluate(node => {
        const rect = node.getBoundingClientRect();
        return [...node.querySelectorAll<HTMLElement>('[data-slot="carousel-previous"], [data-slot="carousel-next"]')]
          .filter(el => el.getClientRects().length > 0)
          .map(el => {
            const button = el.getBoundingClientRect();
            return { left: button.left - rect.left, right: button.right - rect.right };
          });
      });
      for (const button of overflow) {
        expect(button.left, `${card.id}: carousel previous/next outside left edge`).toBeGreaterThanOrEqual(-2);
        expect(button.right, `${card.id}: carousel previous/next outside right edge`).toBeLessThanOrEqual(2);
      }
    }
    expect(errors, `${group.screen}: uncaught browser errors`).toEqual([]);
    const documentOverflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(documentOverflow).toBeLessThanOrEqual(2);
  });
}

test('@visual-regression composite explorer: selected composition renders without exceptions', async ({ page }) => {
  const failures: string[] = [];
  page.on('pageerror', error => failures.push(error.message));
  await page.goto('/?screen=explorador-compostos');
  for (const name of ['ShippingAddress', 'Invoice', 'NotificationSettings']) {
    await page.getByLabel('Buscar componente').fill(name);
    await page.getByRole('button', { name, exact: true }).click();
    const preview = page.getByTestId('catalog-live-preview');
    await expect(preview).toBeVisible();
    await expect(preview).not.toContainText('Prévia bloqueada: contrato inválido.');
    await expect(preview.locator('[data-composite]')).toHaveCount(1);
    await auditVisualGeometry(preview.locator('[data-composite]'), name);
  }
  expect(failures).toEqual([]);
});
