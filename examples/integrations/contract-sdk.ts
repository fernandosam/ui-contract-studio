/**
 * E12 source-level integration example. NOT a published package or HTTP endpoint.
 * Host callers must pin the repository commit and expected per-contract identity.
 */
import { createContractSdk } from "../../src/sdk";
import type { SpecJson, ValidationResult } from "../../src/sdk";

export type ContractPin = Readonly<{
  type: "Card";
  version: string;
  fingerprint: string;
}>;

export type SafeIssue = Readonly<{ code: string; pointer: string }>;
export type IntegrationFailure = Readonly<{
  code: "CONTRACT_UNAVAILABLE" | "CONTRACT_VERSION_MISMATCH" | "SPEC_INVALID";
  message: string;
  retryable: false;
  issues?: readonly SafeIssue[];
}>;
export type IntegrationOutcome =
  | Readonly<{ ok: true; spec: SpecJson; contract: ContractPin }>
  | Readonly<{ ok: false; error: IntegrationFailure }>;

const failure = (code: IntegrationFailure["code"], message: string): IntegrationOutcome =>
  ({ ok: false, error: { code, message, retryable: false } });

/** Host-facing example envelope, not a change to ContractSdk's public return type. */
export function normalizeValidation(result: ValidationResult):
  | Readonly<{ ok: true; spec: SpecJson }>
  | Readonly<{ ok: false; error: IntegrationFailure }> {
  if (result.valid) return { ok: true, spec: result.spec };
  return {
    ok: false,
    error: {
      code: "SPEC_INVALID",
      message: "Specification rejected by the reviewed contract validator.",
      retryable: false,
      // Codes/paths are for the submitter, never for raw logs or analytics.
      // Never return Zod messages, props, state, or the rejected input.
      issues: result.issues.slice(0, 20).map(issue => ({
        code: issue.code.slice(0, 64),
        pointer: issue.pointer.slice(0, 160),
      })),
    },
  };
}

/**
 * Demonstrates fail-closed version/fingerprint checking and deterministic JSON
 * generation. The caller supplies a previously reviewed, immutable pin.
 */
export function generatePinnedCard(expected: ContractPin): IntegrationOutcome {
  const sdk = createContractSdk(); // stable by default
  const current = sdk.inspect("Card");
  if (!current) return failure("CONTRACT_UNAVAILABLE", "The reviewed contract is unavailable.");
  if (expected.type !== current.type || expected.version !== current.version ||
      expected.fingerprint !== current.fingerprint) {
    return failure("CONTRACT_VERSION_MISMATCH", "Contract identity has changed; review before upgrading.");
  }
  const result = normalizeValidation(sdk.generate({
    root: "intro",
    nodes: [{
      id: "intro",
      type: "Card",
      props: { title: "Welcome", description: null },
    }],
  }));
  return result.ok
    ? { ok: true, spec: result.spec, contract: expected }
    : result;
}
