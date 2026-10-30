#!/usr/bin/env node
// E11: static production-output audit. No network requests, instrumentation or uploads.
import { existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, extname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { brotliCompressSync, constants, gzipSync } from "node:zlib";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const codeExtensions = new Set([".js", ".css"]);
const MAX_FILES = 5000;
const MAX_FILE_BYTES = 50 * 1024 * 1024;
const order = (a, b) => a.localeCompare(b, "en");

function entriesIn(directory, base, entries) {
  for (const name of readdirSync(directory).sort(order)) {
    const file = join(directory, name);
    const info = lstatSync(file);
    if (info.isSymbolicLink()) throw new Error("Build contém symlink: " + name);
    if (info.isDirectory()) { entriesIn(file, base, entries); continue; }
    if (!info.isFile()) throw new Error("Entrada de build não regular: " + name);
    if (info.size > MAX_FILE_BYTES) throw new Error("Asset acima do limite de auditoria: " + name);
    if (entries.length >= MAX_FILES) throw new Error("Build excedeu o limite de arquivos");
    const path = relative(base, file).split(sep).join("/");
    const code = codeExtensions.has(extname(name).toLowerCase());
    const bytes = readFileSync(file);
    entries.push({
      path,
      type: extname(name).toLowerCase() || "(none)",
      raw: bytes.length,
      ...(code ? {
        gzip: gzipSync(bytes, { level: 9 }).length,
        brotli: brotliCompressSync(bytes, {
          params: { [constants.BROTLI_PARAM_QUALITY]: 6 },
        }).length,
      } : {}),
    });
  }
}

function directReferences(html) {
  const paths = new Set();
  for (const match of html.matchAll(/<(script|link)\b[^>]*>/gi)) {
    const tag = match[0];
    const type = match[1].toLowerCase();
    const rel = /\brel\s*=\s*["']([^"']+)["']/i.exec(tag)?.[1] || "";
    if (type === "link" && !/\b(?:stylesheet|modulepreload)\b/i.test(rel)) continue;
    const url = /\b(?:src|href)\s*=\s*["']([^"']+)["']/i.exec(tag)?.[1];
    if (!url || /^(?:https?:)?\/\//i.test(url) || /^data:/i.test(url)) continue;
    const decoded = decodeURIComponent(new URL(url, "https://audit.local/").pathname);
    const path = decoded.replace(/^\/+/, "");
    if (path) paths.add(path);
  }
  return [...paths].sort(order);
}

function totals(items) {
  return items.reduce((sum, item) => ({
    raw: sum.raw + item.raw,
    gzip: sum.gzip + (item.gzip ?? 0),
    brotli: sum.brotli + (item.brotli ?? 0),
  }), { raw: 0, gzip: 0, brotli: 0 });
}

export function inspectBuild(dir) {
  const base = resolve(dir);
  if (!existsSync(base) || !lstatSync(base).isDirectory()) {
    throw new Error("Diretório dist inexistente: execute npm run build antes da auditoria");
  }
  const index = join(base, "index.html");
  if (!existsSync(index) || !lstatSync(index).isFile()) {
    throw new Error("index.html de produção ausente");
  }
  const files = [];
  entriesIn(base, base, files);
  const referenced = directReferences(readFileSync(index, "utf8"));
  for (const path of referenced) {
    if (!files.some(file => file.path === path)) {
      throw new Error("Recurso inicial não encontrado no build: " + path);
    }
  }
  const code = files.filter(file => codeExtensions.has(file.type));
  const initialCode = code.filter(file => referenced.includes(file.path));
  return {
    schemaVersion: 1,
    measuredAt: new Date().toISOString(),
    method: "vite-production-filesystem",
    fileCount: files.length,
    htmlReferences: referenced,
    code: totals(code),
    htmlReferencedCode: totals(initialCode),
    codeFiles: code.length,
    nonCodeRawBytes: files.filter(file => !codeExtensions.has(file.type))
      .reduce((sum, file) => sum + file.raw, 0),
    largestCodeFiles: [...code].sort((a, b) => b.brotli - a.brotli || order(a.path, b.path))
      .slice(0, 20).map(file => ({ ...file, htmlReferenced: referenced.includes(file.path) })),
    files: files.map(file => ({ ...file, htmlReferenced: referenced.includes(file.path) })),
  };
}

export function compareBuilds(current, baseline) {
  if (current?.schemaVersion !== 1 || baseline?.schemaVersion !== 1) {
    throw new Error("Baseline incompatível: schemaVersion 1 obrigatório");
  }
  const limits = [
    { metric: "htmlReferencedCode", encoding: "gzip", maximum: 0.15 },
    { metric: "code", encoding: "gzip", maximum: 0.20 },
    { metric: "code", encoding: "brotli", maximum: 0.20 },
  ];
  return limits.map(({ metric, encoding, maximum }) => {
    const previous = baseline[metric]?.[encoding];
    const present = current[metric]?.[encoding];
    if (!Number.isFinite(previous) || previous <= 0 || !Number.isFinite(present) || present < 0) {
      throw new Error("Baseline sem valores válidos para " + metric + "/" + encoding);
    }
    const deltaRatio = present / previous - 1;
    return {
      metric: metric + "." + encoding,
      baselineBytes: previous,
      currentBytes: present,
      deltaPercent: Math.round(deltaRatio * 10000) / 100,
      maximumPercent: maximum * 100,
      regression: deltaRatio > maximum + 1e-10,
    };
  });
}

function parseCli(args) {
  const options = { dist: resolve(root, "dist"), compare: null };
  for (const arg of args) {
    if (arg.startsWith("--dist=")) options.dist = resolve(arg.slice(7));
    else if (arg.startsWith("--compare=")) options.compare = resolve(arg.slice(10));
    else throw new Error("Argumento desconhecido: " + arg);
  }
  return options;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const options = parseCli(process.argv.slice(2));
    const result = inspectBuild(options.dist);
    if (options.compare) {
      if (lstatSync(options.compare).isSymbolicLink()) throw new Error("Baseline em symlink não é aceita");
      const baseline = JSON.parse(readFileSync(options.compare, "utf8"));
      result.comparison = compareBuilds(result, baseline);
      if (result.comparison.some(row => row.regression)) process.exitCode = 1;
    }
    const out = resolve(root, "reports/web-performance/bundle.json");
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, JSON.stringify(result, null, 2) + "\n", { flag: "w", mode: 0o600 });
    console.log("E11 bundle: " + result.fileCount + " arquivos; JS/CSS " +
      result.code.gzip + " B gzip, " + result.code.brotli + " B Brotli; HTML direto " +
      result.htmlReferencedCode.gzip + " B gzip.");
    if (result.comparison) console.log(JSON.stringify(result.comparison, null, 2));
    console.log("Relatório local: reports/web-performance/bundle.json");
  } catch (error) {
    console.error("E11 bundle: " + (error instanceof Error ? error.message : String(error)));
    process.exitCode = 1;
  }
}
