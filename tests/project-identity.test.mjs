import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("nome público e lockfile do projeto permanecem consistentes", () => {
  const pkg = JSON.parse(read("package.json"));
  const lock = JSON.parse(read("package-lock.json"));
  assert.equal(pkg.name, "ui-contract-studio");
  assert.equal(lock.name, pkg.name);
  assert.equal(lock.packages[""].name, pkg.name);
  assert.match(read("index.html"), /UI Contract Studio/);
  assert.match(read("src/ui-runtime/layout.tsx"), /UI Contract Studio/);
  assert.match(read("LICENSE"), /^MIT License/);
  assert.match(read("THIRD_PARTY_NOTICES.md"), /shadcn\/ui/);
  assert.match(read("THIRD_PARTY_NOTICES.md"), /ReUI/);
});

test("arquivos ativos não fazem referência às variáveis institucionais antigas", () => {
  const files = [
    "package.json", "package-lock.json", "index.html", "src/ui-runtime/layout.tsx",
    "playwright.config.ts", "sandbox/Dockerfile", "sandbox/README.md",
    "sandbox/run-all-tests.sh", "sandbox/registry-probe.mjs",
    ".github/workflows/quality.yml", ".github/workflows/e2e-manual.yml",
    ".github/workflows/bootstrap-visual.yml",
  ];
  for (const file of files) {
    const formerSuffix = String.fromCharCode(116, 114, 116, 49, 56);
    const obsolete = new RegExp(`interface-${formerSuffix}|${formerSuffix}`, "i");
    assert.doesNotMatch(read(file), obsolete, `Referência legada em ${file}`);
  }
});

test("README, documentação e histórico versionado usam a identidade pública", () => {
  const formerSuffix = String.fromCharCode(116, 114, 116, 49, 56);
  const forbidden = new RegExp(`interface-${formerSuffix}|${formerSuffix}`, "i");
  const files = [
    "README.md", "CHANGELOG.md", "docs/publicacao-open-source.md",
    "docs/quality.md", "docs/architecture.md",
  ];
  for (const file of files) {
    assert.doesNotMatch(read(file), forbidden, `Identidade antiga em ${file}`);
  }
  assert.ok(read("README.md").includes("git clone https://github.com/fernandosam/ui-contract-studio.git"));
  assert.match(read("README.md"), /cd ui-contract-studio/);
});
