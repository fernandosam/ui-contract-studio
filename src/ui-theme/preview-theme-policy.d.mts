import type {ThemeSelection, ThemeMode} from "./theme-policy.mjs";
type ResolvedTheme = ReturnType<typeof import("./theme-policy.mjs").resolveTheme>;
export const PREVIEW_THEME_STORAGE_KEY: "ui-contract-studio-preview-theme";
export type PreviewThemeOption = Readonly<{value:string; label:string; selection: ThemeSelection}>;
export function listPreviewThemes(registry: unknown): readonly PreviewThemeOption[];
export function selectPreviewTheme(value: unknown, registry: unknown): ResolvedTheme;
export function restorePreviewTheme(stored: unknown, registry: unknown, legacyMode?: ThemeMode | null): ResolvedTheme;
export function serializePreviewTheme(selection: unknown, registry: unknown): string;
