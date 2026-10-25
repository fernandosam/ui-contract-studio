[English](README.md) | [Português](README.pt-BR.md)

# Connected Testing Sandbox

The sandbox is an auxiliary environment for verifying the project with **real dependencies, HTTPS network access, and a browser**, not a shortcut for assuming compatibility. Official scripts live in `sandbox/` and must not produce fake lockfiles or test results.

## npm Connectivity

~~~bash
npm run sandbox:registry:probe
UI_CONTRACT_STUDIO_NPM_REGISTRY=https://registry.npmmirror.com npm run sandbox:verify
~~~

Custom endpoints can be provided through `UI_CONTRACT_STUDIO_NPM_REGISTRIES` (comma-separated). The script checks DNS/TLS and saves details to `reports/sandbox/npm-registry-probe.json` without changing the global npm registry. The **shadcn/ui component registry is different** from the npm registry. Never disable TLS verification or use HTTP mirrors.

## Running the sandbox

On Linux/WSL:

~~~bash
bash sandbox/run-all-tests.sh
~~~

The script runs structural tests before attempting network access, installs dependencies, verifies shadcn primitives, generates schemas, runs checks, lint, typecheck, build, and Playwright tests. Logs are saved in `reports/sandbox/run.log`; a DNS failure must be reported as **not executed**, not as success.

With Docker:

~~~bash
docker build -f sandbox/Dockerfile -t ui-contract-studio-sandbox .
docker run --rm -v "$PWD/reports:/workspace/reports" ui-contract-studio-sandbox
~~~

Docker also needs Internet access for dependencies and base images. Running Playwright locally through the sandbox **does not change** GitHub policy: the full E2E suite is manually triggered on `main`.

## Visual Evidence

For official shadcn examples, use `npm run shadcn:official:capture` and `npm run shadcn:official:compare` as described in the [official audit](../docs/official-component-visual-audit.md). Local captures are diagnostic; visual approval requires state matching and human review. References to the old Galleries 1 and 2 concern **historical content removed from the product**, not a current validation step.

The [quality documentation](../docs/development.md) distinguishes automated testing, manual E2E, and visual certification.
