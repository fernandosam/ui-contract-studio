import test from "node:test";
import assert from "node:assert/strict";
import { createContractSdk } from "../src/sdk";
import { generatePinnedCard, normalizeValidation } from "../examples/integrations/contract-sdk";

const sdk = createContractSdk();
const card = sdk.inspect("Card");

test("E12 documented example generates a pinned stable spec", () => {
  assert.ok(card);
  const result = generatePinnedCard({
    type: "Card", version: card.version, fingerprint: card.fingerprint,
  });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.spec.root, "intro");
  assert.equal(sdk.validate(result.spec).valid, true);
  assert.equal(result.contract.fingerprint, card.fingerprint);
});

test("E12 documented example rejects stale fingerprints without fallback", () => {
  assert.ok(card);
  const result = generatePinnedCard({
    type: "Card", version: card.version, fingerprint: "0".repeat(64),
  });
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.equal(result.error.code, "CONTRACT_VERSION_MISMATCH");
  assert.equal(result.error.retryable, false);
});

test("E12 example maps validation issues without rejected values or messages", () => {
  const marker = "PRIVATE-SECRET-NEVER-RETURN";
  const invalid = sdk.validate({
    root: "page",
    elements: {
      page: { type: "Card", props: {
        title: "Example", description: null, unknownProperty: marker,
      }, children: [] },
    },
  });
  assert.equal(invalid.valid, false);
  const normalized = normalizeValidation(invalid);
  assert.equal(normalized.ok, false);
  if (normalized.ok) return;
  assert.equal(normalized.error.code, "SPEC_INVALID");
  assert.equal(normalized.error.retryable, false);
  assert.ok(normalized.error.issues?.length);
  assert.doesNotMatch(JSON.stringify(normalized), /PRIVATE-SECRET-NEVER-RETURN/);
  assert.ok(normalized.error.issues!.every(issue => !("message" in issue)));
});
