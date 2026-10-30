[English](web-performance.md) | [Português](web-performance.pt-BR.md)

# E11 — Production rendering, bundles, memory and mobile lab

This is an **opt-in**, local diagnostic suite. It does not approve a performance baseline, change the Pi catalog, expand Zod schemas, alter Admission Engine permissions, or add a required CI gate. It complements the separate [E11 load baselines](https://github.com/fernandosam/ui-contract-studio/pull/180) when that pending work is integrated.

## Run

With Node.js 22+, locked dependencies installed via `npm ci` and Chromium installed via `npm run test:e2e:install`:

```sh
npm run perf:web:all
```

The command builds the real production frontend, inspects `dist/`, launches `vite preview` at 127.0.0.1:4173, runs the **separate** Playwright performance config and generates a Markdown summary. The normal E2E configuration is unchanged.

Individual steps: `npm run perf:web:bundle`, `npm run perf:web:browser`, `npm run perf:web:report`. The first two rebuild independently. The last command requires ten fresh browser reports plus a matching recent bundle report, not stale artifacts.

Outputs are gitignored and remain local:

- `reports/web-performance/bundle.json`: every emitted asset, JS/CSS raw/gzip/Brotli sizes, HTML-direct references (a **lower bound** for startup), largest JS/CSS files.
- `reports/web-performance/browser/{desktop,mobile}-*.json`: three navigations, five representative repeated interactions, Chromium CDP JS heap observations, FCP/LCP/CLS, long tasks, resource bytes and horizontal overflow, browser exceptions and blocked external requests.
- `reports/web-performance/summary.md`: aggregated, explicitly labeled diagnostic readings. Playwright also attaches individual JSON results.

The five scenarios are ReUI gallery filtering, primitive discovery, composite Dashboard01 preview, JSON example selection, and login theme switching. Both desktop and mobile projects are exercised, for **10 total browser cases**. The Pixel 7 profile uses browser device emulation plus CDP **4× CPU slowdown, 150 ms latency and 1.6 Mbit/s download**. The desktop profile is not throttled. Browser tests block outbound requests; fixtures should be public demonstration data only.

## Interpreting results and regressions

- Use **actual** production builds and record the commit, Node version, browser version, machine, CPU/network profile and runs when proposing an approved baseline. The browser report is generated automatically, but local machine/browser metadata must accompany any approved reference.
- Compare the bundle snapshot only against a **reviewed, measured** reference: `node scripts/audit-web-performance.mjs --compare=PATH_TO_APPROVED_BUNDLE_JSON`. This fails if gzip for HTML-direct JS/CSS grows by more than 15%, or if total JS/CSS gzip or Brotli grows by more than 20%. Those are provisional comparison thresholds, **not** an approved byte budget.
- Report FCP, LCP, CLS, number/duration of long tasks, cold vs repeated navigations, p95 of Playwright **automation wall time**, and JS heap samples. Do not call automation wall time INP, or a short-run heap delta a proven memory leak.
- Investigate missing FCP/LCP (N/D), unexpected outbound resources, browser errors, horizontal overflow and unusually large new chunks. Review against multiple runs of the same profile before calling a regression.
- A JS/CSS file directly referenced by `index.html` is not necessarily the entire initial dependency graph; runtime imports, modulepreloads, font transfer, HTTP compression, caches and request priorities need a browser network trace for exact startup bytes.

**Limitations:** Emulating Pixel 7 does not measure a physical device, thermal throttling, battery drain, actual RAM, garbage collection stability or the physical screen. CDP `JSHeapUsedSize` is JavaScript heap, **not** total process/device memory. FCP and LCP may be absent in some browser runs and must remain N/D. No real numerical performance measurement can be claimed until this suite runs on a full checkout with dependencies and Chromium. The full E2E remains manual on `main`, and visual quality requires review of real captures.

## Verification

```sh
node --test tests/web-performance.test.mjs tests/web-performance-report.test.mjs
npm run test:offline
npm run docs:check
npm run semantic:check
npm run semantic:report
npm run validate
npm run build
npm run perf:web:all
```

Do not merge solely on static source checks; retain actual results and clearly separate measured results from pending validation.
