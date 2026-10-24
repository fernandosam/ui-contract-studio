import { isAbsolute, relative, resolve } from "node:path";
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

/**
 * Best-effort Pi guard. Not a sandbox: CI and review enforce invariants.
 * Admitted extensions may be edited; the 41 base contracts are protected.
 */
export default function (pi: ExtensionAPI) {
  const root = process.cwd();
  const protectedPath = (path: string) => {
    const absolute = isAbsolute(path) ? resolve(path) : resolve(root, path);
    const rel = relative(root, absolute).replaceAll("\\", "/");
    if (rel.startsWith("../") || rel === "..") return false;
    if (/^src\/(?:pages|screens)\//.test(rel)) return true;
    if (/^src\/ui-screens\/.*\.[jt]sx?$/.test(rel)) return true;
    if (rel.startsWith("src/ui-catalog/extensions/generated/")) return true;
    if (["src/ui-catalog/catalog.ts", "src/ui-catalog/registry.tsx", "src/ui-catalog/contracts.lock.json", "src/ui-catalog/sources.json", "components.json", "shadcn-plan.json"].includes(rel)) return true;
    if (/^src\/components\/ui\//.test(rel)) return true; // UI oficial entra apenas via script/CLI revisado
    // Base React adapters may be reviewed/migrated; baseline schemas remain protected.
    if (/^src\/ui-runtime\//.test(rel)) return true;
    if (["src/globals.css", "src/index.css"].includes(rel)) return true;
    if (/^src\/.*\.[jt]sx$/.test(rel)) {
      return !rel.startsWith("src/ui-catalog/extensions/components/") &&
        !rel.startsWith("src/ui-catalog/extensions/composites/") &&
        rel !== "src/ui-catalog/extensions/registry.tsx" &&
        !["src/main.tsx"].includes(rel);
    }
    return false;
  };
  pi.on("tool_call", async (event) => {
    if (event.toolName === "write" || event.toolName === "edit") {
      const path = (event.input as { path?: string }).path;
      if (path && protectedPath(path)) return {
        block: true,
        reason: `Arquivo de UI protegido: ${path}. Novos componentes somente em src/ui-catalog/extensions/, seguidos de aprovação no manifesto e testes.`,
      };
    }
    if (event.toolName === "bash") {
      const command = (event.input as { command?: string }).command ?? "";
      // Apenas heurística: não é uma fronteira de segurança completa.
      if (/(?:src\/ui-catalog\/(?:catalog\.ts|registry\.tsx|contracts\.lock\.json|sources\.json|components\/)|src\/ui-runtime\/|src\/ui-screens\/[^\s]*\.[jt]sx?|src\/components\/ui\/|components\.json|shadcn-plan\.json)/.test(command) &&
        /(?:>|\btee\b|\bcp\b|\bmv\b|\btouch\b|\bmkdir\b|\bsed\s+-i)/.test(command)) {
        return { block: true, reason: "Comando tenta alterar código de UI protegido; utilize src/ui-catalog/extensions/ e specs JSON." };
      }
    }
  });
}
