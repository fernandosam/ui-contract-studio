import { test, expect } from '@playwright/test';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

// A source-backed example from shadcn/ui is NOT necessarily the same composition
// as the local json-render sample. Capture both; never auto-label pixel similarity as fidelity.
type Example = { component: string; docPath: string; exampleId: string; style: string; capture: 'component' | 'block'; localType: string | null };
const manifest = JSON.parse(readFileSync('scripts/official-component-examples.json', 'utf8')) as {
  upstream: string; examples: Example[];
};
const plan = JSON.parse(readFileSync('shadcn-plan.json', 'utf8')) as { groups: Array<{ items: Array<{ name: string }> }> };
const installed = plan.groups.flatMap(group => group.items.map(item => item.name));
const types = new Set((JSON.parse(readFileSync('pi-catalog/contracts.json', 'utf8')) as {
  contracts: Array<{type:string}>
}).contracts.map(item => item.type));
if (manifest.examples.length !== installed.length ||
  manifest.examples.some(item => !installed.includes(item.component)) ||
  new Set(manifest.examples.map(item => item.component)).size !== installed.length) {
  throw new Error('O manifesto oficial precisa cobrir exatamente as primitivas aprovadas em shadcn-plan.json');
}
for (const example of manifest.examples) {
  const expected = example.component.split('-').map(part => part[0].toUpperCase() + part.slice(1)).join('');
  if (example.localType !== (types.has(expected) ? expected : null)) {
    throw new Error(`Mapeamento local incorreto de ${example.component}: ${example.localType}`);
  }
}
const dest = 'reports/official-components';
test.describe('@official-docs referência pública versus Explorer local', () => {
  for (const example of manifest.examples) {
    test(`@official-docs ${example.component}: captura oficial e local`, async ({ page }, testInfo) => {
      test.setTimeout(120_000);
      const viewport = testInfo.project.name;
      const size = viewport === 'mobile' ? { width: 390, height: 844 } : { width: 1440, height: 900 };
      await page.setViewportSize(size);
      const officialDirectory = join(dest, 'official', viewport);
      const localDirectory = join(dest, 'local', viewport);
      mkdirSync(officialDirectory, { recursive: true });
      mkdirSync(localDirectory, { recursive: true });
      const url = new URL(example.docPath, manifest.upstream).toString();
      const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45_000 });
      expect(response, `Nenhuma resposta de ${url}`).not.toBeNull();
      expect(response!.status(), `HTTP do exemplo oficial ${url}`).toBeLessThan(400);
      // Sidebar e outros blocos usam iframe responsivo que pode estar oculto
      // no modo mobile. Ler o src real e abrir a demo oficial diretamente,
      // sem criar uma captura artificial nem forçar a exibição por CSS.
      let sourceViewUrl = url;
      if (example.capture === 'block') {
        const embed = page.locator(`iframe[src$="/${example.style}/${example.exampleId}"]`).first();
        await expect(embed, `Iframe oficial ausente: ${example.exampleId}`).toHaveCount(1);
        const frameSrc = await embed.getAttribute('src');
        expect(frameSrc, 'O iframe oficial precisa declarar sua origem').toBeTruthy();
        const viewUrl = new URL(frameSrc!, url);
        expect(viewUrl.origin, 'O exemplo deve pertencer ao domínio oficial').toBe(new URL(manifest.upstream).origin);
        expect(viewUrl.pathname, 'Identidade da demo no iframe').toBe(`/view/${example.style}/${example.exampleId}`);
        const viewResponse = await page.goto(viewUrl.toString(), { waitUntil: 'domcontentloaded', timeout: 45_000 });
        expect(viewResponse, 'A demo oficial precisa responder').not.toBeNull();
        expect(viewResponse!.status(), 'HTTP da demo oficial').toBeLessThan(400);
        await expect(page.locator('body')).toBeVisible({ timeout: 14_000 });
        await expect(page.locator('[data-slot="sidebar-wrapper"], [data-sidebar="sidebar"]').first(),
          'A demo oficial deve renderizar a Sidebar').toBeAttached({ timeout: 14_000 });
        await page.evaluate(() => document.fonts.ready);
        await page.screenshot({ path: join(officialDirectory, `${example.component}.png`), animations: 'disabled', fullPage: false, timeout: 14_000 });
        sourceViewUrl = viewUrl.toString();
      } else {
        const preview = page.locator('[data-slot="component-preview"] [data-slot="preview"] .preview, [data-slot="component-preview"] [data-slot="preview"], [data-slot="component-preview"] .preview').first();
        await expect(preview, `Exemplo oficial não encontrado: ${example.exampleId}`).toBeVisible({ timeout: 14_000 });
        await page.evaluate(() => document.fonts.ready);
        await preview.screenshot({ path: join(officialDirectory, `${example.component}.png`), animations: 'disabled', timeout: 14_000 });
      }

      const detailDirectory = join(dest, 'provenance', viewport);
      mkdirSync(detailDirectory, { recursive: true });
      const evidence: Record<string, unknown> = {
        component: example.component, documentationUrl: url, sourceExampleId: example.exampleId,
        sourceViewUrl, upstreamStyle: example.style, sourceKind: example.capture, viewport: size,
        observedAt: new Date().toISOString(),
        comparisonKind: 'different-demo-qualitative',
      };
      if (example.localType) {
        await page.goto('/?screen=explorador-primitivos', { waitUntil: 'domcontentloaded' });
        await page.getByLabel('Buscar componente').fill(example.localType);
        await page.getByRole('button', { name: example.localType, exact: true }).click();
        const preview = page.getByTestId('catalog-live-preview');
        await expect(preview, `Amostra local ausente: ${example.localType}`).toBeVisible({ timeout: 10_000 });
        await expect(preview.getByText('Prévia bloqueada: contrato inválido.')).toHaveCount(0);
        await page.evaluate(() => document.fonts.ready);
        await preview.screenshot({ path: join(localDirectory, `${example.component}.png`), animations: 'disabled', timeout: 14_000 });
        evidence.localSample = `pi-catalog/examples/${example.localType}.json`;
        evidence.localContract = example.localType;
      } else {
        evidence.mappingStatus = 'no-local-contract';
      }
      writeFileSync(join(detailDirectory, `${example.component}.json`), JSON.stringify(evidence, null, 2) + '\n');
    });
  }
});
