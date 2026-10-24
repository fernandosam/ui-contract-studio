import { auditVisualGeometry } from './visual-geometry';
import { test, expect } from '@playwright/test';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

type Block = { id: string; name: string; family: string; previewUrl: string };
const blocks = (JSON.parse(readFileSync('src/ui-catalog/block-source-inventory.json', 'utf8')) as { blocks: Block[] })
  .blocks.filter(b => b.family === 'login' || b.family === 'signup');

for (const block of blocks) {
  test(`@auth-layout ${block.id}: fields, alignment, spacing and responsive bounds`, async ({ page }, info) => {
    const viewport = info.project.name === 'mobile'
      ? { width: 390, height: 844 } : { width: 1440, height: 900 };
    await page.setViewportSize(viewport);
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`/?screen=${block.family === 'login' ? 'blocos-login' : 'blocos-signup'}`);
    const root = page.locator(`[data-shadcn-block="${block.name}"]`);
    await expect(root).toBeVisible({ timeout: 30000 });
    await root.scrollIntoViewIfNeeded();
    await expect(root).not.toContainText('Componente indisponível');
    const sharedGeometry = await auditVisualGeometry(root, block.id);
    const measurement = await root.evaluate((element) => {
      const rect = (el: Element) => {
        const r = el.getBoundingClientRect();
        return { x: r.x, y: r.y, right: r.right, bottom: r.bottom, width: r.width, height: r.height };
      };
      const outer = rect(element);
      const controls = Array.from(element.querySelectorAll<HTMLInputElement>('input:not([type="hidden"]), select, textarea'))
        .filter(el => el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden');
      const actions = Array.from(element.querySelectorAll<HTMLButtonElement>('button'))
        .filter(el => el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden');
      const fields = controls.map(el => ({ label: el.getAttribute('aria-label') || el.getAttribute('name') || el.id, ...rect(el) }));
      const buttons = actions.map(el => ({ label: el.textContent?.trim(), ...rect(el) }));
      const all = [...fields, ...buttons];
      const overflow = all.filter(r => r.x < outer.x - 2 || r.right > outer.right + 2);
      const fieldCollisions = fields.flatMap((a, index) => fields.slice(index + 1).filter(b => {
        const overlapX = Math.min(a.right, b.right) - Math.max(a.x, b.x);
        const overlapY = Math.min(a.bottom, b.bottom) - Math.max(a.y, b.y);
        return overlapX > 4 && overlapY > 4;
      }).map(b => [a.label, b.label]));
      const verticalFields = fields.filter((f, i) => fields.some((other, j) => j !== i &&
        Math.min(f.right, other.right) - Math.max(f.x, other.x) > Math.min(f.width, other.width) * 0.5));
      const fieldGaps = verticalFields.sort((a, b) => a.y - b.y)
        .slice(1).map((f, i) => Math.round(f.y - verticalFields[i].bottom))
        .filter(g => g >= 0);
      return { outer, fields, buttons, overflow, fieldCollisions, fieldGaps };
    });
    expect(measurement.outer.width, 'block must have nonzero width').toBeGreaterThan(100);
    expect(measurement.outer.x, 'block left must fit viewport').toBeGreaterThanOrEqual(-2);
    expect(measurement.outer.right, 'block right must fit viewport').toBeLessThanOrEqual(viewport.width + 2);
    expect(measurement.fields.length, 'auth form should expose input fields').toBeGreaterThanOrEqual(1);
    for (const field of measurement.fields) {
      expect(field.width, `${field.label}: input should be usable`).toBeGreaterThanOrEqual(90);
      expect(field.height, `${field.label}: input should be usable`).toBeGreaterThanOrEqual(24);
    }
    expect(measurement.overflow, 'interactive controls must stay within block').toEqual([]);
    expect(measurement.fieldCollisions, 'fields must not overlap').toEqual([]);
    expect(errors, 'uncaught browser exceptions').toEqual([]);
    const pageOverflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(pageOverflow, 'horizontal document overflow').toBeLessThanOrEqual(2);
    const folder = join('reports/auth-layout', info.project.name);
    mkdirSync(folder, { recursive: true });
    writeFileSync(join(folder, `${block.name}.json`), JSON.stringify({
      block: block.id, reference: block.previewUrl, viewport, ...measurement, sharedGeometry,
      note: 'Geometry audit only; visual pixel equivalence requires matched official baseline.',
    }, null, 2));
    await root.screenshot({ path: join(folder, `${block.name}.png`), animations: 'disabled' });
  });
}
