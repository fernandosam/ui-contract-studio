import { readdirSync, readFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import ts from "typescript";

/** Detecta uso indevido de JSX fora da camada autorizada. Segurança completa requer CI + code review. */
const root = resolve(process.cwd(), "src");
const allowed = new Set(["main.tsx", "ui-runtime/app.tsx", "ui-runtime/layout.tsx", "ui-runtime/spec-screen.tsx", "ui-runtime/requirements-wizard.tsx", "ui-runtime/pattern-wizard.tsx", "ui-runtime/layout-quality-panel.tsx", "ui-runtime/catalog-explorer.tsx", "ui-runtime/composition-recommendations.tsx", "ui-runtime/typed-confirmation-pilot.tsx", "ui-runtime/admission-explorer.tsx", "ui-runtime/reui-composite-explorer.tsx", "ui-catalog/registry.tsx"]);
const errors: string[] = [];
function walk(path: string) {
  for (const entry of readdirSync(path, { withFileTypes:true })) {
    const full=join(path,entry.name);
    if (entry.isDirectory()) { walk(full); continue; }
    const rel=relative(root,full).replaceAll("\\","/");
    if (!/\.[jt]sx?$/.test(rel)) continue;
    const text=readFileSync(full,"utf8");
    const canContainVisuals = allowed.has(rel) || rel.startsWith("ui-catalog/components/") || rel.startsWith("components/ui/") || rel.startsWith("ui-catalog/extensions/components/") || rel.startsWith("ui-catalog/extensions/composites/") || rel.startsWith("ui-catalog/admission-engine/generated/") || rel === "ui-catalog/extensions/registry.tsx";
    // E09: UI code may render and emit local events; only reviewed adapters access the network.
    const isUiSurface = rel.startsWith("ui-runtime/") || rel.startsWith("ui-catalog/");
    const isDataTableAdapter = rel === "ui-catalog/extensions/components/data-table.tsx";

    const file = ts.createSourceFile(rel,text,ts.ScriptTarget.Latest,true, /\.[jt]sx$/.test(rel) ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
    function visit(node: ts.Node) {
      const isJsx = ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node) || ts.isJsxFragment(node);
      if (isJsx && !canContainVisuals) errors.push(`${rel}: JSX fora dos componentes aprovados/runtime.`);
      if (ts.isCallExpression(node) && /(?:React\.)?createElement$/.test(node.expression.getText(file)) && !canContainVisuals) errors.push(`${rel}: React.createElement fora da camada aprovada.`);
      if (isUiSurface && ts.isCallExpression(node)) {
        const callee=node.expression.getText(file);
        if (/^(?:(?:window|globalThis)\\.)?(?:fetch|eval|open)$/.test(callee) ||
          /^(?:(?:window|globalThis)\\.)?(?:navigator\\.sendBeacon|location\\.(?:assign|replace))$/.test(callee)) {
          errors.push(`${rel}: Network API forbidden in UI; use an explicitly authorized adapter.`);
        }
      }
      if (isUiSurface && ts.isNewExpression(node) &&
        /^(?:(?:window|globalThis)\\.)?(?:XMLHttpRequest|WebSocket|EventSource|Function|Worker|SharedWorker)$/.test(node.expression.getText(file))) {
        errors.push(`${rel}: Network API forbidden in UI; use an explicitly authorized adapter.`);
      }
      if (ts.isImportDeclaration(node)) {
        const source=node.moduleSpecifier.getText(file).replaceAll(/["']/g,"");
        if (isUiSurface && /(?:^|\\/)ui-requirements\\//.test(source)) {
          errors.push(`${rel}: serviços de submissão são exclusivos do servidor.`);
        }
        if (isUiSurface && /(?:^|\\/)ui-data\\//.test(source) &&
          !source.endsWith("/data-access-context") &&
          !(isDataTableAdapter && source.endsWith("/providers"))) {
          errors.push(`${rel}: fontes de dados devem passar pelo DataTable e pelo adaptador autorizado.`);
        }
        if (!canContainVisuals && source === "react/jsx-runtime") errors.push(`${rel}: runtime JSX manual fora da biblioteca.`);
        if ((rel.startsWith("ui-runtime/") || rel === "main.tsx") && /ui-catalog\/components/.test(source)) errors.push(`${rel}: import de componentes fora do registry.`);
        if (/^(?:@\/components\/ui(?:\/|$)|\.\.\/components\/ui\/)/.test(source)) {
          const isAllowedImport = rel.startsWith("components/ui/") || rel.startsWith("ui-catalog/components/") || rel.startsWith("ui-catalog/extensions/components/") || rel.startsWith("ui-catalog/extensions/composites/") || rel.startsWith("ui-catalog/admission-engine/generated/") || rel === "ui-catalog/extensions/registry.tsx" || rel === "ui-runtime/layout.tsx";
          if (!isAllowedImport) errors.push(`${rel}: componentes shadcn importados fora de adaptadores ou shell fixo.`);
        }
      }
      ts.forEachChild(node,visit);
    }
    visit(file);
    if (rel.startsWith("pages/") || rel.startsWith("screens/")) errors.push(`${rel}: telas devem residir somente em ui-screens/*.json.`);
  }
}
walk(root);
if (errors.length) { for (const item of [...new Set(errors)]) console.error(`✗ ${item}`); process.exit(1); }
console.log("✓ Limites arquiteturais do código de interfaces verificados.");
