import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildSemanticKnowledge, validateSemanticOverlay, selectAgentSemanticAdvice } from "../scripts/lib/semantic-knowledge.mjs";

const read = name => JSON.parse(readFileSync(`src/ui-catalog/knowledge/${name}.json`, "utf8"));

test("T09: four ReUI form controls have reviewed, evidence-backed overlays", () => {
  const expected = {
    Input: ["pi-allowed-html-types", "local-value-binding-and-change", "typed-form-submission"],
    Checkbox: ["controlled-boolean-initialization", "local-checked-change", "indeterminate-tristate-pi"],
    RadioGroup: ["baseui-react-wrapper", "radio-pi-counterpart", "radio-group-pi-type"],
    Switch: ["local-checked-and-default", "pi-size-sm-default", "async-setting-persistence"],
  };
  for (const [name, ids] of Object.entries(expected)) {
    const slug = name.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
    const overlay = read(slug);
    assert.equal(overlay.component, name);
    assert.equal(overlay.status, "reviewed-documentation");
    assert.equal(overlay.source.provider, "ReUI");
    assert.equal(overlay.source.url, `https://reui.io/components/${slug}`);
    assert.equal(overlay.source.reviewedOn, "2026-10-27");
    assert.deepEqual(validateSemanticOverlay(overlay), []);
    assert.ok(overlay.whenUse.length && overlay.whenNotUse.length && overlay.agentNotes.length);
    assert.ok(overlay.integrations.length && overlay.faqDecisions.length && overlay.derivedTestCases.length);
    for (const id of ids) assert.ok(overlay.capabilities.some(c => c.id === id), `${name}: ${id}`);
    for (const capability of overlay.capabilities) {
      if (capability.state === "implemented-static-evidence") assert.ok(capability.evidence.length);
      else assert.deepEqual(capability.evidence, []);
    }
    assert.ok(overlay.derivedTestCases.some(c => c.kind === "manual-a11y"));
    assert.ok(overlay.derivedTestCases.some(c => c.kind === "candidate-not-executable"));
  }
});

test("T09: approved Pi Radio and React RadioGroup never become interchangeable types", () => {
  const radio = read("radio");
  const group = read("radio-group");
  assert.deepEqual(validateSemanticOverlay(radio), []);
  assert.equal(radio.source.provider, "shadcn");
  assert.equal(radio.source.reviewedOn, "2026-10-27");
  const { report, errors } = buildSemanticKnowledge();
  assert.deepEqual(errors, []);
  const byName = new Map(report.profiles.map(profile => [profile.component, profile]));
  assert.equal(byName.get("Radio")?.approvedPiType, true);
  assert.equal(byName.get("RadioGroup")?.approvedPiType, false);
  assert.equal(byName.get("RadioGroup")?.documentationReview, "reviewed-documentation");
  assert.equal(byName.get("Radio")?.documentationReview, "reviewed-documentation");
  assert.equal(byName.get("Radio")?.integrationCandidates.find(x => x.component === "RadioGroup")?.approvedPiType, false);
  assert.deepEqual(selectAgentSemanticAdvice(report, ["RadioGroup"]), []);
  const advice = selectAgentSemanticAdvice(report, ["Radio"]);
  assert.equal(advice.length, 1);
  assert.equal(advice[0].guidanceOnly, true);
  assert.ok(advice[0].implementationGaps.some(x => x.id === "native-name-formdata"));
  assert.ok(advice[0].integrationCandidates.every(x => x.admission === "not-granted"));
});

test("T09: documented form capabilities are not promoted to implemented by prose", () => {
  const cases = [
    ["input", "typed-form-submission"],
    ["checkbox", "indeterminate-tristate-pi"],
    ["radio-group", "radio-group-pi-type"],
    ["radio", "native-name-formdata"],
    ["switch", "async-setting-persistence"],
  ];
  for (const [slug, id] of cases) {
    const source = read(slug);
    const gap = source.capabilities.find(x => x.id === id);
    assert.equal(gap?.state, "documented-not-implemented", `${slug}: ${id}`);
    const corrupted = structuredClone(source);
    const cap = corrupted.capabilities.find(x => x.id === id);
    cap.state = "implemented-static-evidence";
    assert.ok(validateSemanticOverlay(corrupted).some(x => x.includes("needs first-party evidence")));
    const evidenceCap = corrupted.capabilities.find(x => x.state === "implemented-static-evidence" && x.evidence.length);
    evidenceCap.evidence[0].contains = "NOT_A_REAL_IMPLEMENTATION";
    assert.ok(validateSemanticOverlay(corrupted).some(x => x.includes("stale or missing code evidence")));
  }
});
