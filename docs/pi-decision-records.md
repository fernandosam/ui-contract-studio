[English](pi-decision-records.md) | [Português](pi-decision-records.pt-BR.md)

# E10 — Contract- and evidence-referenced Pi decisions

Semantic selection decisions are **advisory only**: not admission, approval, authorization, runtime proof, full E2E evidence, or evidence the model followed its context. This record complements [E10 execution events](pi-execution-events.md) without granting capabilities.

## Closed, versioned record

Each JSONL line follows `scripts/lib/pi-decision-records.mjs` schema v1:

- `decisionId` (per-decision UUID), `executionId` (shared with execution events), UTC timestamp, `pi-select` or `pi-context` source, and `authority: advisory-only`.
- Outcome `recommended`, `ambiguous`, or `no-match`; the selected contract is non-null **only** for a substantiated recommendation.
- Bounded candidates: reviewed `contract.type`, `contract.version`, `contract.fingerprint`, disposition, score, coverage, and per-candidate criteria `stableEligible`, `hasPositiveEvidence`, `negativeVeto`.
- Evidence **references rather than excerpts**: `type`, `purpose`, `whenUse`, or `whenNotUse` field; positional index in the semantic profile; and matched term count. `profileDigest` is SHA-256 of the referenced profile's `component/purpose/whenUse/whenNotUse` data. Reconstruct the historical profile from the matching Git revision to verify the reference.
- Policy `pi-semantic-selection` v1: stable already-admitted contracts only; minimum coverage 0.6; minimum lead 3 points where another positive candidate exists; leading coverage, score lead, and coverage comparison are retained. `evaluatedCount` is the full set considered; `loggedCount` may be limited by `--limit`.

A `pi:context` command without `--requirement` represents host-supplied types, **not** a claimed agent semantic decision, and emits no decision record.

## Opt-in local usage

```bash
export UI_CONTRACT_EXECUTION_ID="$(node -e 'process.stdout.write(require("node:crypto").randomUUID())')"
export UI_CONTRACT_EVENTS_FILE=reports/pi-execution/events.jsonl
export UI_CONTRACT_DECISIONS_FILE=reports/pi-execution/decisions.jsonl

npm run pi:select -- --requirement="explicit button action" --types=Button,Card
npm run pi:context -- --types=Button,Card --requirement="explicit button action" --metadata-only --stdout
```

Without `UI_CONTRACT_DECISIONS_FILE`, no decision record is persisted and command stdout stays unchanged. Use **different files** for events and decisions. File targets are restricted to `reports/pi-execution/<name>.jsonl`; traversal and symlink redirects are rejected. Outputs are local Git-ignored diagnostic files; no automatic upload or retention.

## Privacy, guarantees and checks

No prompts, requirement text, matched words, semantic excerpts, paths, screen JSON, model outputs, exception stacks, credentials, or personal data are serialized. Contract fingerprints and profile hashes anchor the metadata to the reviewed knowledge; historical reviews are needed after knowledge changes.

Diagnostic JSONL is not distributed transactional evidence. A crash can leave an incomplete execution. Logs do not grant Pi permissions and do not prove a human approval or end-to-end runtime behavior. Define retention and access controls before sharing logs.

```bash
node --test tests/pi-decision-records.test.mjs tests/execution-events.test.mjs tests/pi-semantic-selection.test.mjs
npm run semantic:check
npm run semantic:report
npm run test:offline
npm run docs:check
```

Run these checks against a complete checkout and review PR CI status. Complete browser E2E remains a later manual step on main.