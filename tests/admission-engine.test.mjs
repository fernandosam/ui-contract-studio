import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { evaluatePolicy, verifyE2eEvidence } from "../scripts/admission-engine.mjs";

const ids = ["invalid-and-exact-match", "cancel-and-reopen", "keyboard-focus", "responsive-layout", "schema-and-no-network"];
const projects = ["desktop", "mobile"];
function inputs() {
  return {
    policy: { schemaVersion: 1, mode: "opt-in-experimental",
      allowedScenarios: ["alert-typed"], e2eEligible: ["alert-typed"] },
    recipes: { recipes: [{ id: "alert-typed", target: "TypedConfirmationDialog", review: "required" }] },
    scenarios: { scenarios: [{ id: "alert-typed", target: "TypedConfirmationDialog",
      strategy: "react-candidate", dependencies: ["Button", "Input"] }] },
    lock: { components: [{ name: "Button", status: "approved" }, { name: "Input", status: "approved" }] },
    pi: { components: [{ type: "Button",tier:"base" }] }, sources: { components: [] }
  };
}
test("only explicit reviewed, safe, non-Pi recipes can enter the experimental lane", () => {
  const data = inputs();
  assert.deepEqual(evaluatePolicy(data), []);
  data.scenarios.scenarios[0].dependencies.push("UnknownPrimitive");
  assert.match(evaluatePolicy(data).join(" "), /unapproved primitive/);
  data.scenarios.scenarios[0].dependencies.pop();
  data.pi.components.push({ type: "TypedConfirmationDialog",tier:"base" });
  assert.match(evaluatePolicy(data).join(" "), /already present/);
});
test("unknown E2E protocol cannot auto-promote candidates", () => {
  const data = inputs();
  data.policy.e2eEligible = ["alert-checkbox"];
  assert.match(evaluatePolicy(data).join(" "), /no verified browser/);
  data.policy.allowedScenarios.push("made-up");
  assert.match(evaluatePolicy(data).join(" "), /unknown, unreviewed/);
});
function createEvidence(root) {
  const base = join(root, "reports/composition-validation/typed-confirmation");
  mkdirSync(base, { recursive: true });
  const summary = { schemaVersion: 1, target: "TypedConfirmationDialog",
    admission: "not-approved", piExposure: false,
    browserChecks: { status: "passed", executions: 10, projects,
      cases: ids.map(id => ({ id })) } };
  writeFileSync(join(base, "summary.json"), JSON.stringify(summary));
  for (const project of projects) for (const caseId of ids) {
    const directory = join(base, project);
    mkdirSync(directory, { recursive: true });
    writeFileSync(join(directory, caseId + ".json"), JSON.stringify({
      schemaVersion: 1, scenarioId: "alert-typed", project, caseId,
      status: "passed", expectedStatus: "passed", screenshotStatus: "captured",
      retry: 0, errors: []
    }));
    writeFileSync(join(directory, caseId + ".png"), Buffer.from("evidence", "utf8"));
  }
  return base;
}
test("E2E homologation requires all 10 case/project results and screenshots", t => {
  const root = mkdtempSync(join(tmpdir(), "admission-engine-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const base = createEvidence(root);
  const candidate = { id: "alert-typed", target: "TypedConfirmationDialog" };
  assert.equal(verifyE2eEvidence(root, candidate).length, 10);
  rmSync(join(base, "mobile", "keyboard-focus.png"));
  assert.throws(() => verifyE2eEvidence(root, candidate), /missing or failing/);
  writeFileSync(join(base, "mobile", "keyboard-focus.png"), "evidence");
  const path = join(base, "desktop", "cancel-and-reopen.json");
  const record = JSON.parse(readFileSync(path,"utf8"));
  record.status = "failed";
  writeFileSync(path, JSON.stringify(record));
  assert.throws(() => verifyE2eEvidence(root, candidate), /missing or failing/);
  assert.throws(() => verifyE2eEvidence(root, { id: "button-copy", target: "CopyFeedbackButton" }),
    /No E2E protocol/);
});
