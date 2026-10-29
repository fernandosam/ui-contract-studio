[English](stable-contracts-pi.md) | [Português](stable-contracts-pi.pt-BR.md)

# Stable contracts and Pi auto-discovery

The reviewed `src/ui-catalog/contracts.lock.json` is the source of truth for each base/extension contract's `version`, `semanticFingerprint`, and `stability` (`experimental`, `beta`, `stable`, `deprecated`). A contract must also have `status: approved` before it can be stable.

`scripts/build-pi-api.mjs` projects metadata into the generated `pi-catalog/contracts.json`; **this file is not a second approval registry**. `scripts/select-pi-context.mjs` fails closed when its projection diverges from the reviewed contract. Stable contracts are available on the default Pi channel without a second approval step. Experimental and beta contracts remain outside the default channel.

Composition candidates preserve their existing source digests, protocols, CI verification and the experimental lane. A CI-required proof is **not** permission for remote actions. Pi exposure means a declarative, validated JSON UI schema only, with action permissions unchanged.

Contract edits require normal PR review, [per-contract SemVer compatibility classification](contract-versioning.md), regenerated projection and existing semantic/contract checks. Run:

```sh
npm run contracts:check
npm run pi:api:check
npm run admission:check
npm run test:offline
npm run semantic:check
npm run semantic:report
```

The regression suite includes `tests/stable-pi-contracts.test.mjs`. A green static check does not replace independent browser evidence for experimental compositions.

To regenerate a reviewed projection: `npm run pi:api`. Never edit generated Pi metadata as a substitute for updating and reviewing the authoritative contract.
