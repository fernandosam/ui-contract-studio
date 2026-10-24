#!/usr/bin/env bash
# User-managed reproducible WSL/CI sandbox; installs only within this project.
set -Eeuo pipefail
cd "$(dirname "$0")/.."
mkdir -p reports/sandbox
report="reports/sandbox/run.log"
: > "$report"
exec > >(tee -a "$report") 2>&1
trap 'echo "FALHA na linha $LINENO (comando: $BASH_COMMAND)"' ERR
node --version; npm --version
node --test tests/*.test.mjs
# Verify HTTPS metadata and choose a reachable npm mirror without touching global .npmrc.
# Override with UI_CONTRACT_STUDIO_NPM_REGISTRY or a comma-separated UI_CONTRACT_STUDIO_NPM_REGISTRIES.
# npm cache/lockfile is not complete in this archive: an online registry is required.
if ! registry="$(node sandbox/registry-probe.mjs --select)"; then
  echo "BLOQUEADO: nenhuma fonte npm HTTPS respondeu (DNS/rede/TLS)." >&2
  echo "Relatório: reports/sandbox/npm-registry-probe.json" >&2
  echo "Não use strict-ssl=false nem HTTP; o problema exige rede/DNS ou proxy configurado no host." >&2
  echo "Pendentes: dependências reais, Zod, typecheck, lint, build e comparação visual." >&2
  exit 25
fi
export npm_config_registry="$registry"
echo "Registry npm selecionado: $npm_config_registry (TLS obrigatório)"
# npm install resolves dependencies and creates the lockfile in the sandbox only.
npm install --include=dev --no-audit --no-fund
npm run shadcn:install
npm run shadcn:verify
npm install --package-lock-only --ignore-scripts --no-audit --no-fund
npm ci --no-audit --no-fund
npm run integration:update
npm run pi:zod-schema
npm run check
npm run test
npm run lint
npm run typecheck
npm run build
# If available, reuse the host's audited Chromium binary.
if [[ -z "${UI_CONTRACT_STUDIO_CHROMIUM_EXECUTABLE:-}" ]] && command -v chromium >/dev/null; then
  export UI_CONTRACT_STUDIO_CHROMIUM_EXECUTABLE="$(command -v chromium)"
fi
if [[ -z "${UI_CONTRACT_STUDIO_CHROMIUM_EXECUTABLE:-}" ]]; then
  npx playwright install chromium
fi
npm run test:e2e
printf 'Sandbox concluída. Logs: %s\n' "$report"
