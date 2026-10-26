import test from "node:test";
import assert from "node:assert/strict";
import { evaluatePolicy, verifyE2eEvidence } from "../scripts/admission-engine.mjs";

function inputs() {
  return {
    policy: { schemaVersion: 1, mode: "opt-in-experimental",
      allowedScenarios: ["alert-typed"], e2eEligible: ["alert-typed"] },
    recipes: { recipes: [{ id: "alert-typed", target: "TypedConfirmationDialog", review: "required" }] },
    scenarios: { scenarios: [{ id: "alert-typed", target: "TypedConfirmationDialog",
      strategy: "react-candidate", dependencies: ["Button", "Input"] }] },
    lock: { components: [{ name: "Button", status: "approved" }, { name: "Input", status: "approved" }] },
    pi: { components: [{ type: "Button",tier:"base" }] }, sources: { components: [] },
    protocols:{candidates:{"alert-typed":{target:"TypedConfirmationDialog",protocol:"typed-confirmation-desktop-mobile",cases:["invalid-and-exact-match","cancel-and-reopen","keyboard-focus","responsive-layout","schema-and-no-network"]}}}
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
test("E2E verification cannot bypass the official protocol registry",()=>{
 assert.throws(()=>verifyE2eEvidence(process.cwd(),{id:"unknown-candidate",target:"Unknown"}),
   /No E2E protocol/);
});
