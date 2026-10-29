import {resolveTheme, validateThemeRegistry} from "./theme-policy.mjs";

export const PREVIEW_THEME_STORAGE_KEY = "ui-contract-studio-preview-theme";

/** The host generates values only from the reviewed registry, never from screen JSON. */
export function listPreviewThemes(registry) {
  const allowed = validateThemeRegistry(registry);
  return Object.freeze(allowed.themes.flatMap(theme => theme.modes.map(mode => {
    const selection = Object.freeze({id: theme.id, version: theme.version, mode});
    return Object.freeze({
      value: theme.id + "@" + theme.version + ":" + mode,
      label: theme.id + " v" + theme.version + " — " + (mode === "light" ? "Claro" : "Escuro"),
      selection,
    });
  })));
}

/** An arbitrary select value cannot become a CSS class, variant or token. */
export function selectPreviewTheme(value, registry) {
  if (typeof value !== "string") throw new TypeError("Seleção de tema inválida.");
  const option = listPreviewThemes(registry).find(item => item.value === value);
  if (!option) throw new TypeError("Tema de prévia não registrado.");
  return resolveTheme(option.selection, registry);
}

/** Stored selections are untrusted. Invalid/deleted versions fail back to a reviewed default. */
export function restorePreviewTheme(stored, registry, legacyMode) {
  const allowed = validateThemeRegistry(registry);
  if (typeof stored === "string" && stored.length <= 200) {
    try { return resolveTheme(JSON.parse(stored), allowed); }
    catch { /* corrupt or obsolete value: fallback without accepting its fields */ }
  }
  if (legacyMode === "light" || legacyMode === "dark") {
    try { return resolveTheme({...allowed.defaultTheme, mode: legacyMode}, allowed); }
    catch { /* the default may not support the legacy mode */ }
  }
  return resolveTheme(allowed.defaultTheme, allowed);
}

export function serializePreviewTheme(selection, registry) {
  const resolved = resolveTheme(selection, registry);
  return JSON.stringify({id: resolved.id, version: resolved.version, mode: resolved.mode});
}
