import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const root = "src/ui-catalog/extensions/composites";
const guidance = JSON.parse(readFileSync("src/ui-catalog/reui-guidance.json", "utf8"));
const index = readFileSync(`${root}/reui-button-index.ts`, "utf8");
const preview = readFileSync(`${root}/reui-preview.tsx`, "utf8");

test("Galeria 3: todos os exemplos Button são composições individuais e registradas", () => {
  const entries = guidance.Button.examples;
  assert.equal(entries.length, 61, "ReUI Button: manter os 61 exemplos conhecidos");
  assert.deepEqual(entries.map(([, id]) => id), Array.from({length: 61}, (_, i) => `c-button-${i + 1}`));
  for (let n = 1; n <= entries.length; n++) {
    const path = `${root}/reui-button-${n}.tsx`;
    assert.ok(existsSync(path), `Prévia ausente: ${path}`);
    const source = readFileSync(path, "utf8");
    assert.match(source, new RegExp(`export function ReuiButtonPattern${n}\\b`), `Export ausente em ${path}`);
    assert.match(index, new RegExp(`import \\{ReuiButtonPattern${n}\\} from`), `Índice sem Button ${n}`);
    assert.ok(!source.includes("dangerouslySetInnerHTML") && !source.includes("eval("), `Conteúdo inseguro em ${path}`);
  }
  assert.match(preview, /reuiButtonPatterns\[index-1\]/);
  assert.match(preview, /data-reui-button-example=\{index\}/);
});
