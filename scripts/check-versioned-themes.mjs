#!/usr/bin/env node
import {readFileSync} from "node:fs";
import {spawnSync} from "node:child_process";
import {verifyThemeLock} from "./lib/theme-lock.mjs";

const path = "src/ui-theme/themes.json";
function load(file) { return JSON.parse(readFileSync(new URL("../" + file, import.meta.url), "utf8")); }
function loadBase(ref) {
  if (!/^[a-f0-9]{40}$/.test(ref)) throw new TypeError("THEME_BASE_REF deve ser o SHA de um commit.");
  const read = spawnSync("git", ["show", ref + ":" + path], {encoding: "utf8", maxBuffer: 1024 * 1024});
  if (read.status !== 0) {
    if (/does not exist in|exists on disk, but not in/i.test(read.stderr ?? "")) return null;
    throw new Error("Não foi possível verificar o tema da branch-base.");
  }
  return JSON.parse(read.stdout);
}
try {
  const base = process.env.THEME_BASE_REF ? loadBase(process.env.THEME_BASE_REF) : null;
  const result = verifyThemeLock(load(path), load("src/ui-theme/themes.lock.json"), base);
  console.log("✓ " + result.checked + " tema(s) versionado(s), tokens fechados, lock consistente" +
    (base ? " e versões anteriores imutáveis." : "."));
} catch (error) {
  console.error("✗ Tema versionado inválido: " + (error instanceof Error ? error.message : "erro desconhecido"));
  process.exitCode = 1;
}
