#!/usr/bin/env node
// Offline documentation links and manifest consistency checker.
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, extname, isAbsolute, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const readJson = (root, p) => JSON.parse(readFileSync(resolve(root, p), "utf8"));
const read = (root, p) => readFileSync(resolve(root, p), "utf8");

function findMarkdown(root, dir) {
  if (!existsSync(resolve(root, dir))) return [];
  return readdirSync(resolve(root, dir), { withFileTypes: true }).flatMap(item => {
    const p = dir + "/" + item.name;
    return item.isDirectory() ? findMarkdown(root, p) : (item.isFile() && extname(p) === ".md" ? [p] : []);
  });
}

function withoutCodeFences(content) {
  let fence = null;
  return content.split("\n").map(line => {
    const delimiter = /^\s*(\x60{3,}|~{3,})/.exec(line)?.[1]?.[0];
    if (delimiter) {
      if (fence === null) fence = delimiter;
      else if (fence === delimiter) fence = null;
      return "";
    }
    return fence === null ? line : "";
  }).join("\n");
}

export function checkLinks(root, file) {
  const errors = [];
  const md = withoutCodeFences(read(root, file));
  const link = /!?\[[^\]\n]*\]\((<[^>]+>|[^\s)]+)(?:\s+["'][^"']*["'])?\)/g;
  for (const match of md.matchAll(link)) {
    const href = match[1].replace(/^<|>$/g, "");
    if (/^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(href)) continue;
    const base = href.split(/[?#]/, 1)[0];
    if (!base) continue;
    let decoded;
    try { decoded = decodeURIComponent(base); }
    catch { errors.push(file + ": endereço inválido " + href); continue; }
    if (isAbsolute(decoded)) {
      errors.push(file + ": referência local absoluta " + href); continue;
    }
    const absolute = resolve(root, dirname(file), decoded);
    const rel = relative(root, absolute);
    if (rel === ".." || rel.startsWith(".." + sep)) {
      errors.push(file + ": link fora do repositório " + href);
    } else if (!existsSync(absolute)) {
      errors.push(file + ": link inexistente " + href);
    } else if (
      file.endsWith(".pt-BR.md") &&
      decoded.endsWith(".md") &&
      !decoded.endsWith(".pt-BR.md") &&
      !/^\[English\]\(/.test(match[0]) &&
      existsSync(resolve(root, dirname(file), decoded.replace(/\.md$/, ".pt-BR.md")))
    ) {
      errors.push(file + ": link para documento em inglês " + href + "; use a versão .pt-BR.md");
    }
  }
  return errors;
}

function compareNames(label, expected, actual, errors) {
  const a = [...expected].sort(), b = [...actual].sort();
  if (a.length !== b.length || a.some((x, i) => x !== b[i])) {
    errors.push(label + ": contratos diferentes (" + a.length + " vs " + b.length + ")");
  }
}

export function checkDocumentation(root = projectRoot) {
  const errors = [];
  const docs = [
    ...findMarkdown(root, "docs"),
    ...findMarkdown(root, ".pi"),
    ...findMarkdown(root, "sandbox"),
    ...readdirSync(root).filter(file => file.endsWith(".md")),

  ];
  for (const file of docs) {
    if (!existsSync(resolve(root, file))) {
      errors.push("Arquivo obrigatório ausente: " + file); continue;
    }
    if (statSync(resolve(root, file)).isFile()) errors.push(...checkLinks(root, file));
  }

  const lock = readJson(root, "src/ui-catalog/contracts.lock.json");
  const sources = readJson(root, "src/ui-catalog/sources.json");
  const pi = readJson(root, "pi-catalog/contracts.json");
  const integration = readJson(root, "integration-status.json");
  const plan = readJson(root, "shadcn-plan.json");
  const reui = readJson(root, "src/ui-catalog/reui-guidance.json");
  const examples = readJson(root, "src/ui-catalog/reui-example-guidance.pt-BR.json");
  const pkg = readJson(root, "package.json");

  const names = lock.components.map(c => c.name);
  compareNames("sources.json", names, sources.components.map(c => c.name), errors);
  compareNames("pi-catalog/contracts.json (base/extension)", names, pi.components.filter(c=>c.tier!=='experimental').map(c=>c.type), errors);
  const experimental=readJson(root,"src/ui-catalog/admission-engine/entries.json").entries;
  compareNames("pi-catalog/contracts.json (admission)",experimental.map(c=>c.type),pi.components.filter(c=>c.tier==='experimental').map(c=>c.type),errors);
  if (pi.schemaVersion!==3 || pi.components.length!==names.length+experimental.length || integration.totalContracts !== names.length) {
    errors.push("Contagem de contratos incompatível entre lock, Pi e integração");
  }
  if (integration.baselineContracts + integration.extensionContracts.length !== names.length) {
    errors.push("Contagem base/extensões incorreta em integration-status");
  }
  if (pi.projectVersion !== pkg.version || integration.version !== pkg.version) {
    errors.push("Versões divergentes entre package, Pi e integration-status");
  }
  const planned = plan.groups.reduce((sum, group) => sum + group.items.length, 0);
  if (integration.requiredPrimitiveCount !== planned || integration.installedPrimitiveCount > planned) {
    errors.push("Plano shadcn e integration-status não concordam");
  }
  const reuiCount = Object.values(reui).reduce((sum, family) => sum + family.examples.length, 0);
  if (Object.keys(examples).length !== reuiCount) errors.push("Inventários ReUI não concordam");

  // Only the architecture guide carries snapshot totals; cross-check them.
  const architecture = read(root, "docs/architecture.md");
  for (const [label, total, pattern] of [
    ["contratos", names.length, /\*\*(\d+) (?:active contracts|contratos ativos)\*\*/],
    ["shadcn", planned, /\*\*(\d+) (?:planned\/local primitives|primitivas planejadas\/locais)\*\*/],
    ["ReUI", reuiCount, /\*\*(\d+) (?:React examples|exemplos React)\*\*/],
  ]) {
    if (Number(architecture.match(pattern)?.[1]) !== total) {
      errors.push("docs/architecture.md: quantidade de " + label + " desatualizada");
    }
  }
  return errors;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const errors = checkDocumentation();
  if (errors.length) {
    console.error("Documentação inconsistente:\n" + errors.map(e => " - " + e).join("\n"));
    process.exitCode = 1;
  } else console.log("Documentação OK: links locais, contratos, versões, shadcn e ReUI.");
}
