import {createHash} from "node:crypto";
import {validateThemeRegistry} from "../../src/ui-theme/theme-policy.mjs";

function strictObject(value, keys, label) {
  if (!value || typeof value !== "object" || Array.isArray(value) ||
      Object.getPrototypeOf(value) !== Object.prototype ||
      Object.keys(value).length !== keys.length ||
      !keys.every(key => Object.hasOwn(value, key))) {
    throw new TypeError(label + ": campos inesperados ou ausentes.");
  }
}
function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])]));
  }
  return value;
}
export function fingerprintTheme(theme) {
  return "sha256:" + createHash("sha256").update(JSON.stringify(canonical(theme))).digest("hex");
}
/** The lock detects drift; base comparison makes an existing version immutable across PRs. */
export function verifyThemeLock(registry, lock, baseRegistry = null) {
  const current = validateThemeRegistry(registry);
  strictObject(lock, ["schemaVersion", "entries"], "themes.lock");
  if (lock.schemaVersion !== 1 || !Array.isArray(lock.entries) ||
      lock.entries.length !== current.themes.length) {
    throw new TypeError("Lock de temas ausente ou incompleto.");
  }
  const actual = new Map();
  for (const item of lock.entries) {
    strictObject(item, ["id", "version", "fingerprint"], "theme lock entry");
    if (typeof item.id !== "string" || typeof item.version !== "string" ||
        typeof item.fingerprint !== "string" || !/^sha256:[0-9a-f]{64}$/.test(item.fingerprint)) {
      throw new TypeError("Entrada do lock de temas inválida.");
    }
    const key = item.id + "@" + item.version;
    if (actual.has(key)) throw new TypeError("Versão duplicada no lock de temas.");
    actual.set(key, item.fingerprint);
  }
  for (const theme of current.themes) {
    const key = theme.id + "@" + theme.version;
    if (actual.get(key) !== fingerprintTheme(theme)) {
      throw new TypeError("Fingerprint divergente para o tema " + key + ".");
    }
  }
  if (baseRegistry !== null) {
    const base = validateThemeRegistry(baseRegistry);
    const next = new Map(current.themes.map(theme => [theme.id + "@" + theme.version, theme]));
    for (const previous of base.themes) {
      const key = previous.id + "@" + previous.version;
      if (!next.has(key) || fingerprintTheme(next.get(key)) !== fingerprintTheme(previous)) {
        throw new TypeError("Versão de tema já publicada não pode ser editada/removida: " + key + ".");
      }
    }
  }
  return Object.freeze({checked: current.themes.length, defaultTheme: current.defaultTheme});
}
