import { readdirSync, readFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import ts from "typescript";

/** Detecta uso indevido de JSX fora da camada autorizada. Segurança completa requer CI + code review. */
const root = resolve(process.cwd(), "src");
const allowed = new Set(["main.tsx", "ui-runtime/app.tsx", "ui-runtime/layout.tsx", "ui-runtime/spec-screen.tsx", "ui-runtime/catalog-explorer.tsx", "ui-runtime/composition-recommendations.tsx", "ui-runtime/reui-composite-explorer.tsx", "ui-catalog/registry.tsx"]);
const errors: string[] = [];
function walk(path: string) {
  for (const entry of readdirSync(path, { withFileTypes:true })) {
    const full=join(path,entry.name);
    if (entry.isDirectory()) { walk(full); continue; }
    const rel=relative(root,full).replaceAll("\\","/");
    if (!/\.[jt]sx?$/.test(rel)) continue;
    const text=readFileSync(full,"utf8");
    const canContainVisuals = allowed.has(rel) || rel.startsWith("ui-catalog/components/") || rel.startsWith("components/ui/") || rel.startsWith("ui-catalog/extensions/components/") || rel.startsWith("ui-catalog/extensions/composites/") || rel === "ui-catalog/extensions/registry.tsx";
    const file = ts.createSourceFile(rel,text,ts.ScriptTarget.Latest,true, /\.[jt]sx$/.test(rel) ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
    function visit(node: ts.Node) {
      const isJsx = ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node) || ts.isJsxFragment(node);
      if (isJsx && !canContainVisuals) errors.push(`${rel}: JSX fora dos componentes aprovados/runtime.`);
      if (ts.isCallExpression(node) && /(?:React\.)?createElement$/.test(node.expression.getText(file)) && !canContainVisuals) errors.push(`${rel}: React.createElement fora da camada aprovada.`);
      if (ts.isImportDeclaration(node)) {
        const source=node.moduleSpecifier.getText(file).replaceAll(/["']/g,"");
        if (!canContainVisuals && source === "react/jsx-runtime") errors.push(`${rel}: runtime JSX manual fora da biblioteca.`);
        if ((rel.startsWith("ui-runtime/") || rel === "main.tsx") && /ui-catalog\/components/.test(source)) errors.push(`${rel}: import de componentes fora do registry.`);
        if (/^(?:@\/components\/ui(?:\/|$)|\.\.\/components\/ui\/)/.test(source)) {
          const isAllowedImport = rel.startsWith("components/ui/") || rel.startsWith("ui-catalog/components/") || rel.startsWith("ui-catalog/extensions/components/") || rel.startsWith("ui-catalog/extensions/composites/") || rel === "ui-catalog/extensions/registry.tsx" || rel === "ui-runtime/layout.tsx";
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
