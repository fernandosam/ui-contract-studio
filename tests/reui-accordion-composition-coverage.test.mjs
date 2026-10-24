import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";

const root = "src/ui-catalog/extensions/composites";
const guidance = JSON.parse(readFileSync("src/ui-catalog/reui-guidance.json", "utf8"));
const preview = readFileSync(`${root}/reui-preview.tsx`, "utf8");

test("Galeria 3: cada exemplo documentado do Accordion tem composição independente", () => {
  const entries = guidance.Accordion.examples;
  assert.equal(entries.length, 11, "ReUI Accordion: manter as 11 composições conhecidas");
  assert.deepEqual(entries.map(([, id]) => id), Array.from({length: 11}, (_, i) => `c-accordion-${i + 1}`));
  for (let n = 1; n <= entries.length; n++) {
    const path = `${root}/reui-accordion-${n}.tsx`;
    assert.ok(existsSync(path), `Prévia ausente: ${path}`);
    const source = readFileSync(path, "utf8");
    assert.match(source, new RegExp(`export function AccordionPattern${n}\\b`), `Export ausente em ${path}`);
    assert.ok(!source.includes("dangerouslySetInnerHTML") && !source.includes("eval("), `Uso inseguro em ${path}`);
    assert.match(preview, new RegExp(`AccordionPattern${n}\\b`), `Composição ${n} não registrada na Galeria 3`);
  }
  assert.match(preview, /data-reui-accordion-example=\{index\}/);
});
