[English](pi-isolation.md) | [Português](pi-isolation.pt-BR.md)

# E09 — Pi JSON, rendering, local actions and external adapters

Four independently checked boundaries, in order:

1. **Generation:** Pi may write JSON screens and metadata only. The reviewed Zod catalog, `graphErrors` and `npm run pi:validate` enforce types, events, action names, graph limits, and safe state paths. Pi tool hooks are best-effort, not a security sandbox.
2. **Rendering:** `SpecScreen` validates untrusted specs before mounting `Renderer`. It accepts no JSX, executable callbacks, direct URLs or extra capabilities from JSON. Invalid specs fail closed.
3. **Local actions:** the registry exposes only built-in state actions and validated `buttonClick`, `formSubmit`, `linkClick` feedback. The latter validate arguments again at the dispatch boundary and have no HTTP, navigation or submission effects.
4. **External adapters:** `DataTable` reads through `loadDataPage`. The local `demo-processos` source needs no permission; `processos-api` is **denied by default**, even for a schema-valid screen. A trusted application host must explicitly pass `remoteDataEnabled={true}` to `SpecScreen`; it is not a JSON prop or Pi action. The adapter uses a fixed same-origin URL with same-origin credentials, redirect denial and bounded query/response schema. It is not a replacement for backend authentication/authorization. Server-only submission adapters remain unregistered in Pi's action registry.

The static AST boundary check (`npm run check:boundaries`) rejects direct network APIs in renderer, registry, and UI catalog layers, unauthorized imports of submission adapters, and network-adapter imports outside the reviewed `DataTable` component. Offline regression tests (`node --test tests/e09-isolation.test.mjs`) cover fail-closed permissions, forbidden actions, state-path attacks, and boundaries. Run `npm run validate`, `npm run build` and relevant E2E in a prepared environment.

**Limit:** These are application-layer boundaries, not process/OS-level sandboxing. A Pi agent with arbitrary shell/repository access must run in an independently restricted execution environment, with CI, branch protection, secret/network restrictions and independent review. No protection here authorizes a new remote endpoint or a production integration.
