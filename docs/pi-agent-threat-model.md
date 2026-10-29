[English](pi-agent-threat-model.md) | [Português](pi-agent-threat-model.pt-BR.md)

# E09 — Pi Agent threat model

**Scope:** static review of Pi Agent inputs, outputs and execution surfaces in UI Contract Studio.  
**Snapshot:** `main`, 2026-10-29 (verify source changes before accepting this review).  
**Method:** trust boundaries, data flow, STRIDE threat categories, impact/likelihood prioritization.  
**Evidence limit:** this is a source review, **not** penetration testing, dynamic execution, provider certification, or proof of the operator's GitHub/host configuration. The [Portuguese report](pi-agent-threat-model.pt-BR.md) contains the complete surface-by-surface analysis and treatment checklist.

## 1. Assets, actors and distinct execution modes

**Protect:** the Zod catalog, locks/fingerprints, admitted types, registries and action implementations; generated JSON screens; model/provider credentials; prompts, operator sessions and evaluation outputs; CI and review evidence; and runtime availability.

**Untrusted participants/content:** user requirements, external guides and ReUI references, model responses, upstream dependencies, and changes submitted by untrusted contributors. External content must never become higher-priority instructions merely because it appears in a context pack.

Distinguish three modes:

1. **Interactive Pi coding agent:** may have access to `write`, `edit`, and `bash`. `.pi/extensions/ui-guard.ts` explicitly states its path and command checks are best-effort, **not a sandbox**.
2. **Paid evaluation Pi subprocess:** `scripts/run-pi-evals.mjs` uses `--no-tools --no-session`, explicit opt-in, process timeout and output limits. This is **not** a security guarantee for interactive Pi.
3. **React runtime:** `src/ui-runtime/spec-screen.tsx` validates JSON with the stable/experimental Zod catalog and graph invariants **before** giving it to the renderer.

## 2. Trust-boundary diagram

```text
[Requirements, prompts, Markdown, examples, remote sources]  UNTRUSTED
                              |
                              v
[pi:select and pi:context; source-controlled Zod/lock]   DATA ≠ AUTHORITY
                              |
                              v
[Pi model + CLI] ------------------------------> [write/edit/bash, host environment]
        | untrusted output                           interactive use only
        v
[JSON spec + metadata] ---> [Zod + tree checks] ---> [SpecScreen + registry]
                                     |                    | local declared actions
                                     +--> DENY invalid   +--> sourceId -> same-origin API
                                                                 | real backend authn/authz
[manual paid eval --no-tools] --> [JSON outputs, metrics, CI artifacts]
```

| Boundary | Existing code controls | Remaining concern |
| --- | --- | --- |
| Untrusted content → model | `AGENTS.md`, Pi skill, `select-pi-candidates.mjs` semantic advice | Prompt injection or authority confusion in content/context. |
| Model output → admitted JSON | `select-pi-context.mjs` checks projection and lock, requires real schemas for generation, selects at most 25 types; `validate-pi-spec.ts` performs Zod and graph checks | Do not interpret advice, examples or self-declared stability as permissions. |
| JSON → browser | `spec-screen.tsx` revalidates; `catalog.ts` uses strict Zod props; `spec-invariants.mjs` verifies known types, events/actions, tree, element/depth bounds | Resource consumption beyond node/depth counts; review every newly introduced rendering sink. |
| JSON → action/data | `registry.tsx` uses local feedback; `catalog.ts` restricts internal links; `ui-data/providers.ts` uses code-owned source IDs, same-origin fetch and a response schema | Deployed backend needs its own authentication, authorization and tenant isolation. |
| Pi → filesystem/terminal | `.pi/extensions/ui-guard.ts` intercepts selected tool calls heuristically | Tool hooks are not sandboxing; host permissions and credentials remain a critical boundary. |
| Pi eval → CI reports | `run-pi-evals.mjs`, `.github/workflows/pi-evaluation.yml` use opt-in, no tools, read-only GitHub permissions and evidence hashes | Minimize inherited environment, logs, source data, artifact visibility and retention. |
| Change → stable catalog | `build-pi-api.mjs`, admission policy, `.github/workflows/quality.yml` | Human review and effective protected-branch settings must be confirmed independently. |

## 3. Risk register

Risk designations are **priorities**, not demonstrated exploits. P0 = critical, P1 = high, P2 = medium.

| ID | STRIDE / boundary | Threat and impact | Existing control | Residual priority |
| --- | --- | --- | --- | --- |
| PI-01 | Elevation/tampering — host tools | Coding-agent tool access can change host files or environment outside JSON-only generation. | Pi UI guard and subsequent checks/review. | **P0**: use a restricted identity, disposable workspace, deny-by-default tools and credentials; never call the guard a sandbox. |
| PI-02 | Spoofing/tampering — prompt/context | Untrusted content can attempt to override selection or instructions (prompt injection). | Written agent policy and downstream schema validation. | **P1**: mark retrieved text as untrusted data; add adversarial regression cases. |
| PI-03 | Information disclosure — host/eval | Environment secrets, private prompts and data may be reflected into logs or outputs. | Manual opt-in, no-tool evaluation, read-only workflow. | **P1**: environment allowlist, redaction, restricted artifacts and synthetic test markers. |
| PI-04 | Tampering/elevation — JSON contract | Unauthorized component, prop, event, action, URL or data source enters a spec. | Strict Zod, graph invariants, runtime revalidation and internal links. | **P2**: retain negative tests for every changed schema/adapter. |
| PI-05 | Tampering/repudiation — admission/CI | Experimental candidate or claimed evidence becomes treated as stable without independent proof. | Fingerprints, admission policy and browser checks in integration CI. | **P1**: require source-bound evidence and independently verified branch protection. |
| PI-06 | Disclosure/elevation — remote data | A deployed `processos-api` backend omits authentication, authorization or tenant filters. | Source ID allowlist and validated response; `server-example/` is only reference code. | **P1, conditional**: do not enable production backend before negative authorization tests. |
| PI-07 | Denial of service — parsing/rendering | Excessive spec/context sizes, state or nested content exhaust resources. | 300-element and 30-depth graph limits, eval timeouts and selected prop bounds. | **P2**: explicit byte, string, collection, token and runtime budgets. |
| PI-08 | Tampering/injection — React adapters | Future adapters introduce unsafe HTML, link or data sinks despite the closed catalog. | Closed Zod types and JSX architectural checks. | **P2**: review and test actual rendering sinks with each new adapter. |
| PI-09 | Disclosure/repudiation — reports | Model outputs and reports survive or are exposed beyond their intended audience; hash is not proof of privacy. | Output SHA-256 metadata, CI artifacts. | **P2**: access/retention policy, sanitization and run/commit provenance. |
| PI-10 | Tampering/disclosure — CLI file paths | Development CLIs access filesystem resources outside expected directories when called from untrusted automation. | Partial path restrictions on outputs and JSON input filenames. | **P2**: canonical path/root checks; no exposure of local CLIs as public endpoints. |
| PI-11 | Tampering — upstream/supply chain | Imported examples, remote guidance or dependencies compromise advisory context or generated artifacts. | Source-review process, CI, admission controls. | **P1**: pinned origins, reviewed diffs and minimally privileged sync/install jobs. |

**Not established by this review:** successful exploitation, secret exfiltration, cross-tenant access, XSS, arbitrary code execution or a denial of service. Proven security vulnerabilities should be reported privately as described in [SECURITY.md](../SECURITY.md); do not publish exploitable payloads in public PRs.

## 4. Reviewed input/output/execution behavior

**Input:** `.pi/prompts/ui.md` accepts `$ARGUMENTS`; `select-pi-context.mjs` combines contracts, examples and advisory semantic knowledge. Those sources should be treated as data. `src/ui-runtime/screen-registry.ts` collects JSON screens and metadata at build time. `validate-pi-spec.ts` accepts a local JSON file path; it is a developer tool, not a hardened upload endpoint.

**Output:** a screen must contain `root` and `elements`, with well-formed children/slots, known types and allowed actions/events. Invalid screens must fail closed in the validator **and** `SpecScreen`. Diagnostics and evaluation artifacts must not leak sensitive input. No arbitrary JSX, HTML, callbacks or remote URLs are granted by advice or examples.

**Execution:** normal `buttonClick`, `formSubmit` and `linkClick` implementations are local feedback, not real persistence. `processos-api` uses a same-origin request but real authorization belongs to the deployed backend. Manual evaluation uses an intentionally restricted Pi subprocess; interactive coding-agent execution must be isolated separately. Existing GitHub CI proves only the checks it actually executes, not a full penetration test.

## 5. Remediation checklist (not yet implemented by this review)

- [ ] **P0 / PI-01:** isolate interactive Pi in a least-privilege, disposable environment with explicit tool permissions; test forbidden file and process operations.
- [ ] **P1 / PI-02:** adversarial tests for untrusted requirements and retrieved content; verify that data cannot widen types/actions/sources.
- [ ] **P1 / PI-03, PI-09:** minimize process environment and output retention, sanitize artifacts and test with fictitious secrets.
- [ ] **P1 / PI-05:** confirm enforced GitHub rulesets, mandatory independently executed checks and source-bound stable admission.
- [ ] **P1 / PI-06:** require backend authentication, authorization and tenant-isolation negative tests before real API integration.
- [ ] **P1 / PI-11:** lock and audit third-party content/dependency sources and separate ingestion from permission changes.
- [ ] **P2 / PI-04, PI-08:** expand negative Zod/graph/runtime/adapter tests for unknown APIs and unsafe data sinks.
- [ ] **P2 / PI-07:** establish cumulative resource budgets for specs, context, state and rendering.
- [ ] **P2 / PI-10:** normalize local file boundaries and keep validation CLIs out of public request paths.
- [ ] **Ongoing:** reassess when tools, schemas, actions, adapters, remote sources, CI or admission policy change; bind accepted mitigations to reproducible tests and commits.

**E09 review complete when** trust zones, surfaces, controls, residual risks and executable treatment criteria are recorded. This deliverable **does not close any risk or approve production use**.

## 6. Source evidence and validation limits

Files inspected include: `.pi/extensions/ui-guard.ts`, `.pi/prompts/ui.md`, `.pi/skills/ui-catalog/SKILL.md`, `scripts/select-pi-context.mjs`, `scripts/select-pi-candidates.mjs`, `scripts/validate-pi-spec.ts`, `scripts/lib/spec-invariants.mjs`, `scripts/run-pi-evals.mjs`, `scripts/build-pi-api.mjs`, `src/ui-catalog/catalog.ts`, `src/ui-catalog/registry.tsx`, `src/ui-runtime/spec-screen.tsx`, `src/ui-runtime/screen-registry.ts`, `src/ui-data/providers.ts`, `server-example/processos-route.mjs`, `.github/workflows/quality.yml`, `.github/workflows/pi-evaluation.yml` and `.github/workflows/admission-experimental.yml`.

Suggested verification in a working clone with dependencies:

```bash
npm ci --no-audit --no-fund
npm run docs:check
npm run test:offline
npm run pi:zod-schema
npm run pi:verify
npm run validate
npm run build
```

**These commands were not run for this review**: repository files were inspected remotely, and no Pi model evaluation or paid service was executed. GitHub CI results, if produced, must be reported separately.
