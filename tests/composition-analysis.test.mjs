import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { buildCompositionAnalysis, classifyReuiDecision, extractImports, templatePrimitives } from "../scripts/lib/composition-analysis.mjs";

const write = (root, path, contents) => {
  const full = join(root, path);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, typeof contents === "string" ? contents : JSON.stringify(contents));
};

test("static analysis extracts imports and template types without running JSX", () => {
  assert.deepEqual(extractImports('import { Button } from "@/components/ui/button";\n' +
    'export { Card } from "@/components/ui/card";\nconst x = "<NotImported/>";'),
    ["@/components/ui/button", "@/components/ui/card"]);
  assert.deepEqual(templatePrimitives({ elements: {
    a: {type:"Card",children:["b"]}, b:{type:"Button",children:[]}, c:{type:"Card",children:[]},
  }}), ["Button", "Card"]);
  assert.deepEqual(templatePrimitives({elements:{}}), []);
});

test("repo-wide inventory distinguishes approved contracts from all ReUI examples", () => {
  const { report, errors } = buildCompositionAnalysis();
  assert.deepEqual(errors, []);
  assert.equal(report.totals.approvedContracts, 102);
  assert.equal(report.totals.declarativeComposites, 37);
  assert.equal(report.totals.reactComposites, 11);
  assert.equal(report.totals.primitiveAdapters, 13);
  assert.equal(report.totals.reuiExamples, 559);
  assert.equal(report.totals.reuiFamilies, 31);
  assert.equal(report.contracts.length, 61);
  assert.equal(new Set(report.reuiExamples.map(x => x.id)).size, 559);
  assert.ok(report.primitiveImpact.Button.contracts.length > 0);
  assert.ok(report.primitiveImpact.Button.reuiExamples.length > 0);
  const datePicker = report.contracts.find(entry => entry.name === "DatePicker");
  assert.equal(datePicker.implementation, "react");
  assert.ok(datePicker.dependencies.includes("Calendar"));
  assert.ok(datePicker.dependencies.includes("Popover"));
  const login = report.contracts.find(entry => entry.name === "Login01");
  assert.equal(login.implementation, "declarative");
  assert.ok(login.dependencies.includes("Input"));
  for (const sample of report.reuiExamples) {
    assert.equal(sample.exposedToPi, false);
    assert.notEqual(sample.recommendation, "review-required");
  }
});

test("new ReUI patterns require a reviewed semantic decision and are never admitted automatically", () => {
  const root = mkdtempSync(join(tmpdir(), "ui-contract-composition-"));
  try {
    const policy = {
      schemaVersion:1, primitiveExtensions:[], reactComposites:["ExampleCard"],
      reuiDecisionActions:{"existing-primitive-variant":"reuse-primitive","existing-composition":"reuse-approved-composition"},
    };
    write(root, "src/ui-catalog/composition-policy.json", policy);
    write(root, "src/ui-catalog/contracts.lock.json", {components:[{name:"ExampleCard",tier:"extension"}]});
    write(root, "src/ui-catalog/extensions/composites/generated-manifest.json", {components:[]});
    write(root, "src/ui-catalog/reui-guidance.json", {Button:{examples:[["Original","c-button-1"]]}});
    write(root, "src/ui-catalog/reui-example-guidance.pt-BR.json", {
      "c-button-1":{sourceUrl:"https://reui.io/components/button/c-button-1",language:"pt-BR"},
    });
    write(root, "src/ui-catalog/reui-semantic-admissions.json", {entries:[{
      exampleId:"c-button-1", family:"Button", title:"Original", classification:"existing-primitive-variant",
      contractName:"ExampleCard",reviewStatus:"reused",
    }]});
    write(root, "src/ui-catalog/extensions/components/example-card.tsx",
      'import { Button } from "@/components/ui/button";\nexport function ExampleCard(){return <Button/>}');
    write(root, "src/ui-catalog/extensions/composites/reui-button-1.tsx",
      'import { Card } from "@/components/ui/card";\nexport default function Example(){return <Card/>}');
    let output = buildCompositionAnalysis(root);
    assert.deepEqual(output.errors, []);
    assert.deepEqual(output.report.contracts[0].dependencies, ["Button"]);
    assert.equal(output.report.reuiExamples[0].recommendation,"reuse-primitive");

    // No silent auto-discovery, even when the TSX file is present.
    write(root, "src/ui-catalog/extensions/composites/reui-button-2.tsx",
      'import { Badge } from "@/components/ui/badge";\nexport default function Example(){return <Badge/>}');
    output = buildCompositionAnalysis(root);
    assert.ok(output.errors.some(e=>e.includes("unregistered ReUI TSX")));

    write(root, "src/ui-catalog/reui-guidance.json", {Button:{examples:[["Original","c-button-1"],["New","c-button-2"]]}});
    write(root, "src/ui-catalog/reui-example-guidance.pt-BR.json", {
      "c-button-1":{sourceUrl:"https://reui.io/components/button/c-button-1",language:"pt-BR"},
      "c-button-2":{sourceUrl:"https://reui.io/components/button/c-button-2",language:"pt-BR"},
    });
    output = buildCompositionAnalysis(root);
    assert.ok(output.errors.some(e=>e.includes("reviewed semantic admission decision is required")));

    const decisionFile = "src/ui-catalog/reui-semantic-admissions.json";
    const decisionManifest = JSON.parse(readFileSync(join(root,decisionFile),"utf8"));
    decisionManifest.entries.push({exampleId:"c-button-2",family:"Button",title:"New",
      classification:"existing-composition",contractName:"ExampleCard",reviewStatus:"reused"});
    write(root,decisionFile,decisionManifest);
    output = buildCompositionAnalysis(root);
    assert.deepEqual(output.errors, []);
    assert.equal(output.report.totals.reuiExamples,2);
    assert.deepEqual(output.report.reuiExamples[1].dependencies, ["Badge"]);
    assert.equal(output.report.reuiExamples[1].recommendation,"reuse-approved-composition");
    assert.equal(output.report.reuiExamples[1].exposedToPi,false);
  } finally {
    rmSync(root, {recursive:true,force:true});
  }
});

test("unknown classifications never enable access to Pi contracts", () => {
  assert.equal(classifyReuiDecision({classification:"some-new-class"},{reuiDecisionActions:{}}),"review-required");
});
