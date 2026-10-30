/** Closed, dependency-free, host-owned theme contract. Never accepts CSS text. */
export const THEME_SCHEMA_VERSION = 1;
export const THEME_TOKEN_VALUES = Object.freeze({
  color: Object.freeze(["studio-neutral"]),
  typography: Object.freeze(["inter-jetbrains-playfair"]),
  spacing: Object.freeze(["tailwind-v4-default"]),
  border: Object.freeze(["semantic"]),
  radius: Object.freeze(["base-8px"]),
  shadow: Object.freeze(["studio"]),
  density: Object.freeze(["comfortable"]),
});
export const THEME_MODES = Object.freeze(["light", "dark"]);

function strictObject(value, keys, label) {
  if (!value || typeof value !== "object" || Array.isArray(value) ||
      Object.getPrototypeOf(value) !== Object.prototype ||
      Object.keys(value).length !== keys.length ||
      !keys.every(key => Object.hasOwn(value, key))) {
    throw new TypeError(label + ": objeto com campos obrigatórios e fechados esperado.");
  }
}
function validSelection(value) {
  strictObject(value, ["id", "version", "mode"], "theme selection");
  if (typeof value.id !== "string" || !/^[a-z][a-z0-9-]{0,63}$/.test(value.id) ||
      typeof value.version !== "string" || !/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(value.version) ||
      !THEME_MODES.includes(value.mode)) {
    throw new TypeError("Theme selection: ID, versão ou modo não autorizado.");
  }
  return Object.freeze({ id: value.id, version: value.version, mode: value.mode });
}
export function validateThemeRegistry(value) {
  strictObject(value, ["schemaVersion", "defaultTheme", "themes"], "theme registry");
  if (value.schemaVersion !== THEME_SCHEMA_VERSION ||
      !Array.isArray(value.themes) || value.themes.length === 0 || value.themes.length > 32) {
    throw new TypeError("Theme registry: versão de schema ou quantidade de temas inválida.");
  }
  const seen = new Set();
  const themes = value.themes.map((item, index) => {
    const label = "theme[" + index + "]";
    strictObject(item, ["id", "version", "modes", "tokens"], label);
    if (typeof item.id !== "string" || !/^[a-z][a-z0-9-]{0,63}$/.test(item.id) ||
        typeof item.version !== "string" || !/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(item.version)) {
      throw new TypeError(label + ": identificação ou versão inválida.");
    }
    const key = item.id + "@" + item.version;
    if (seen.has(key)) throw new TypeError(label + ": versão duplicada.");
    seen.add(key);
    if (!Array.isArray(item.modes) || !item.modes.length || item.modes.length > THEME_MODES.length ||
        new Set(item.modes).size !== item.modes.length ||
        !item.modes.every(mode => THEME_MODES.includes(mode))) {
      throw new TypeError(label + ": modos não autorizados.");
    }
    const tokenKeys = Object.keys(THEME_TOKEN_VALUES);
    strictObject(item.tokens, tokenKeys, label + ".tokens");
    for (const token of tokenKeys) {
      if (!THEME_TOKEN_VALUES[token].includes(item.tokens[token])) {
        throw new TypeError(label + ": token não autorizado: " + token);
      }
    }
    return Object.freeze({
      id: item.id, version: item.version, modes: Object.freeze([...item.modes]),
      tokens: Object.freeze(Object.fromEntries(tokenKeys.map(key => [key, item.tokens[key]]))),
    });
  });
  const defaultTheme = validSelection(value.defaultTheme);
  if (!themes.some(theme => theme.id === defaultTheme.id &&
      theme.version === defaultTheme.version && theme.modes.includes(defaultTheme.mode))) {
    throw new TypeError("Theme registry: tema padrão sem versão/modo registrado.");
  }
  return Object.freeze({schemaVersion: THEME_SCHEMA_VERSION, defaultTheme, themes: Object.freeze(themes)});
}

/** Rejects unknown or CSS-bearing selections; returns only a trusted, fixed CSS class. */
export function resolveTheme(selection, registry) {
  const allowed = validateThemeRegistry(registry);
  const requested = validSelection(selection);
  const theme = allowed.themes.find(item =>
    item.id === requested.id && item.version === requested.version && item.modes.includes(requested.mode));
  if (!theme) throw new TypeError("Tema ou versão não admitidos.");
  return Object.freeze({
    ...requested,
    tokens: theme.tokens,
    className: requested.mode === "light" ? "light-theme" : "dark-theme",
  });
}
