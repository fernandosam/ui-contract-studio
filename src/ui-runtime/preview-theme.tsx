import {createContext, useContext, useEffect, useId, useState, type ReactNode} from "react";
import manifest from "../ui-theme/themes.json";
import {resolveTheme, validateThemeRegistry} from "../ui-theme/theme-policy.mjs";
import {
  PREVIEW_THEME_STORAGE_KEY, listPreviewThemes, restorePreviewTheme,
  selectPreviewTheme, serializePreviewTheme,
} from "../ui-theme/preview-theme-policy.mjs";

const registry = validateThemeRegistry(manifest);
const options = listPreviewThemes(registry);
type ResolvedTheme = ReturnType<typeof resolveTheme>;
type PreviewThemeState = {
  selection: ResolvedTheme;
  options: typeof options;
  choose: (value: string) => void;
  toggleMode: () => void;
  canToggleMode: boolean;
};
const Context = createContext<PreviewThemeState | null>(null);

/** A single host-owned theme avoids nested light/dark selectors conflicting in a preview. */
export function PreviewThemeProvider({children}: {children: ReactNode}) {
  const [selection, setSelection] = useState<ResolvedTheme>(() => {
    let stored: string | null = null;
    try { stored = localStorage.getItem(PREVIEW_THEME_STORAGE_KEY); }
    catch { /* localStorage is optional */ }
    const legacyMode = document.documentElement.classList.contains("light-theme") ? "light" : "dark";
    return restorePreviewTheme(stored, registry, legacyMode);
  });
  const choose = (value: string) => setSelection(selectPreviewTheme(value, registry));
  const alternate = options.find(option =>
    option.selection.id === selection.id &&
    option.selection.version === selection.version &&
    option.selection.mode !== selection.mode,
  );
  const toggleMode = () => { if (alternate) choose(alternate.value); };

  useEffect(() => {
    // Only two fixed classes returned by the E06 policy can reach the DOM.
    document.documentElement.classList.remove("light-theme", "dark-theme");
    document.documentElement.classList.add(selection.className);
    try {
      // Keep compatibility with the pre-render mode bootstrap in index.html.
      localStorage.setItem("ui-contract-studio-theme", selection.mode);
      localStorage.setItem(PREVIEW_THEME_STORAGE_KEY, serializePreviewTheme({id: selection.id, version: selection.version, mode: selection.mode}, registry));
    } catch { /* storage is optional; session selection remains active */ }
  }, [selection]);

  return <Context.Provider value={{selection, options, choose, toggleMode, canToggleMode: Boolean(alternate)}}>
    {children}
  </Context.Provider>;
}

export function usePreviewTheme() {
  const context = useContext(Context);
  if (!context) throw new Error("O seletor de temas requer o provedor de prévias do host.");
  return context;
}

/** Shared control for primitive, composite and JSON previews; never edits the rendered spec. */
export function PreviewThemeSelector({label = "Tema da prévia"}: {label?: string}) {
  const id = useId();
  const {selection, options, choose} = usePreviewTheme();
  const value = selection.id + "@" + selection.version + ":" + selection.mode;
  return <label htmlFor={id} className="inline-flex min-w-0 flex-wrap items-center gap-2 text-xs font-medium">
    <span>{label}</span>
    <select id={id} aria-label={label} data-testid="preview-theme-selector"
      className="max-w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs text-foreground focus-visible:outline-2 focus-visible:outline-ring"
      value={value} onChange={event => choose(event.target.value)}>
      {options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
    </select>
  </label>;
}
