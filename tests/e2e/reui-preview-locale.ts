import { readFileSync } from "node:fs"

const catalog = JSON.parse(readFileSync("src/ui-catalog/reui-preview-text.pt-BR.json", "utf8")) as Record<string, string>

/** Use the same reviewed translation dictionary as the Vite ReUI source transform. */
export function previewText(original: string): string {
  const localized = (catalog as Record<string, string>)[original]
  if (!localized) throw new Error("Tradução ReUI ausente no catálogo: " + original)
  return localized
}
