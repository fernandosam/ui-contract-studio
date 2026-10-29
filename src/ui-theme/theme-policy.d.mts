export type ThemeMode = "light" | "dark";
export type ThemeSelection = Readonly<{id: string; version: string; mode: ThemeMode}>;
export type ThemeTokens = Readonly<{
  color: "studio-neutral";
  typography: "inter-jetbrains-playfair";
  spacing: "tailwind-v4-default";
  border: "semantic";
  radius: "base-8px";
  shadow: "studio";
  density: "comfortable";
}>;
export type ThemeRecord = Readonly<{
  id: string;
  version: string;
  modes: readonly ThemeMode[];
  tokens: ThemeTokens;
}>;
export type ThemeRegistry = Readonly<{
  schemaVersion: 1;
  defaultTheme: ThemeSelection;
  themes: readonly ThemeRecord[];
}>;
export const THEME_SCHEMA_VERSION: 1;
export const THEME_MODES: readonly ThemeMode[];
export const THEME_TOKEN_VALUES: Readonly<Record<keyof ThemeTokens, readonly string[]>>;
export function validateThemeRegistry(value: unknown): ThemeRegistry;
export function resolveTheme(selection: unknown, registry: unknown): Readonly<ThemeSelection & {
  className: "light-theme" | "dark-theme";
  tokens: ThemeTokens;
}>;
