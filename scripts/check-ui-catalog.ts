import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { catalog, componentDefinitions, actionDefinitions, componentEventDescriptors, playgroundDefinitions } from "../src/ui-catalog/catalog";
import { extensionDefinitions } from "../src/ui-catalog/extensions/catalog";
import { graphErrors } from "./lib/spec-invariants.mjs";
import * as ts from "typescript";

const root = process.cwd();

/**
 * Read declared registry names without importing the React renderer.
 * Catalog/schema validation must work before the optional shadcn bootstrap.
 * The full TypeScript build and integration tests still verify actual imports.
 */
function declaredObjectKeys(sourcePath: string, declarationName: string, allowGeneratedSpread = false): string[] {
  const file = resolve(root, sourcePath);
  const code = readFileSync(file, "utf8");
  const parsed = ts.createSourceFile(file, code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let initializer: ts.Expression | undefined;
  const visit = (node: ts.Node): void => {
    if (ts.isVariableDeclaration(node) &&
        ts.isIdentifier(node.name) && node.name.text === declarationName) {
      initializer = node.initializer;
    }
    ts.forEachChild(node, visit);
  };
  visit(parsed);
  let obj: ts.Expression | undefined = initializer;
  while (obj && (ts.isSatisfiesExpression(obj) ||
    ts.isAsExpression(obj) || ts.isParenthesizedExpression(obj))) {
    obj = obj.expression;
  }
  if (!obj || !ts.isObjectLiteralExpression(obj)) {
    throw new Error(`${sourcePath}: declaração ${declarationName} deve ser um objeto literal.`);
  }
  return obj.properties.map((property) => {
    if(allowGeneratedSpread && ts.isSpreadAssignment(property) && ts.isIdentifier(property.expression) && property.expression.text === 'compositeImplementations') return null;
    if (!ts.isPropertyAssignment(property) && !ts.isMethodDeclaration(property)) {
      throw new Error(`${sourcePath}: ${declarationName} não pode usar spreads ou getters.`);
    }
    const name = property.name;
    if (!name || !(ts.isIdentifier(name) || ts.isStringLiteral(name))) {
      throw new Error(`${sourcePath}: nome de componente inválido.`);
    }
    return name.text;
  }).filter((value):value is string=>value!==null);
}
const baseImplementationNames = declaredObjectKeys("src/ui-catalog/components/playground.tsx", "playgroundImplementations");
const generated = JSON.parse(readFileSync(resolve(root, "src/ui-catalog/extensions/composites/generated-manifest.json"),"utf8")) as {components:Array<{name:string;template:string}>};
const generatedNames=generated.components.map(x=>x.name);
const explicitExtensionNames = declaredObjectKeys("src/ui-catalog/extensions/registry.tsx", "extensionImplementations", true);
const overlaps = explicitExtensionNames.filter(name => generatedNames.includes(name)).sort();
const extensionImplementationNames = [...new Set([...explicitExtensionNames, ...generatedNames])].sort();
const implementationNamesFromSource = [...baseImplementationNames, ...extensionImplementationNames].sort();
const actionImplementationNames = declaredObjectKeys("src/ui-catalog/registry.tsx", "actionImplementations").sort();
const baseNames = Object.keys(playgroundDefinitions).sort();
const extensionNames = Object.keys(extensionDefinitions).sort();
const names = Object.keys(componentDefinitions).sort();
const implementationNames = implementationNamesFromSource;
const versions = JSON.parse(readFileSync(resolve(root, "src/ui-catalog/contracts.lock.json"), "utf8")) as {components:Array<{name:string;version:string;status:string;tier:string}>};
const versionByName = Object.fromEntries(versions.components.map(x=>[x.name,x]));
const sources = JSON.parse(readFileSync(resolve(root, "src/ui-catalog/sources.json"), "utf8")) as {
  components: Array<{ name: string; status: string; origin: string; sourceUrl: string | null; license: string; reviewedOn?: string; notes?: string; contractVersion?: string }>;
};

// Independent upstream baseline whitelist: additions are allowed ONLY in extensions/.
const officialTypes = ['Card', 'Stack', 'Grid', 'Separator', 'Tabs', 'Accordion', 'Collapsible', 'Dialog', 'Drawer', 'Carousel', 'Table', 'Heading', 'Text', 'Image', 'Icon', 'Avatar', 'Badge', 'Alert', 'Progress', 'Skeleton', 'Spinner', 'Tooltip', 'Popover', 'Rating', 'Metric', 'BarGraph', 'LineGraph', 'Input', 'Textarea', 'Select', 'Checkbox', 'Radio', 'Switch', 'Slider', 'Button', 'Link', 'DropdownMenu', 'Toggle', 'ToggleGroup', 'ButtonGroup', 'Pagination'];
const errors: string[] = [];
const same = (a: string[], b: string[]) => JSON.stringify(a) === JSON.stringify(b);
// O preview estático de NotificationSettings é substituído pela versão interativa revisada.
// Outros overrides precisariam de aprovação e teste explícitos.
if (!same(overlaps, ["NotificationSettings"])) errors.push("Sobreposições não aprovadas no registry de extensões: " + overlaps.join(", "));
if (!same(baseNames, [...officialTypes].sort())) errors.push("Os 41 contratos de base foram modificados: adições devem usar extensions/.");
if (extensionNames.some(name => officialTypes.includes(name))) errors.push("As extensões não podem sobrescrever nomes da base.");
if (!same(extensionNames, extensionImplementationNames)) errors.push("Cada extensão precisa de um schema e um adapter no registry.");
if (!same(names, implementationNames)) errors.push("Catálogo e registry divergentes; todo componente precisa de implementação.");
if (!same(Object.keys(actionDefinitions).sort(), actionImplementationNames)) errors.push("Ações e handlers divergentes.");
const manifestNames = sources.components.map(c => c.name).sort();
if (!same(names, manifestNames)) errors.push("sources.json deve registrar exatamente TODOS os componentes do catálogo.");
if (!same(Object.keys(versionByName).sort(), names)) errors.push("contracts.lock.json deve abranger exatamente o catálogo autorizado.");
if (new Set(sources.components.map(c => c.name)).size !== sources.components.length) errors.push("Nomes duplicados em sources.json.");
for (const item of sources.components) {
  if (item.contractVersion !== versionByName[item.name]?.version) errors.push(`${item.name}: versão do contrato divergente entre manifesto e lock.`);
  if (versionByName[item.name]?.status !== "approved") errors.push(`${item.name}: contrato não aprovado no lock.`);
  if (item.status !== "approved") errors.push(`${item.name}: manifesto não aprovado.`);
  if (!item.origin || !item.license || !item.reviewedOn) errors.push(`${item.name}: origem, licença e revisão são obrigatórias.`);
  if (extensionNames.includes(item.name) && (!item.notes?.trim() || !item.sourceUrl && item.origin !== "local")) errors.push(`${item.name}: documente origem externa e decisão de admissão.`);
}
for (const name of extensionNames) {
  const def = extensionDefinitions[name as keyof typeof extensionDefinitions] as { props?: unknown; description?: unknown };
  if (!def?.props || typeof def.description !== "string" || !def.description.trim()) errors.push(`${name}: props Zod estritas e descrição são obrigatórias.`);
  const kebab = name.replace(/(?!^)(?=[A-Z])/g, "-").toLowerCase();
  const componentFile = resolve(root, `src/ui-catalog/extensions/components/${kebab}.tsx`);
  if (!existsSync(componentFile) && !generatedNames.includes(name)) errors.push(`${name}: falta implementação ou manifesto de composição gerada.`);
}
const pathsToCheck = [
 {dir:resolve(root,'src/ui-screens'), name:'Telas', excludeMeta:false},
 {dir:resolve(root,'src/ui-patterns'), name:'Padrões', excludeMeta:true},
];
let checkedCount=0;
for (const location of pathsToCheck) {
const screenDirectory = location.dir;
const filenames = readdirSync(screenDirectory).filter(f => f.endsWith('.json') && (!location.excludeMeta || !f.endsWith('.meta.json')));
if (!filenames.length) errors.push(`Nenhum JSON em ${location.name}`);
for (const filename of filenames) {
  try {
    const spec: unknown = JSON.parse(readFileSync(resolve(screenDirectory, filename), "utf8"));
    const issues = graphErrors(spec, names, { allowedActions: Object.keys(actionDefinitions), allowedEvents: componentEventDescriptors });
    for (const issue of issues) errors.push(`${filename}: ${issue}`);
    const checked = catalog.validate(spec);
    if (!checked.success) errors.push(`${filename}: Zod: ${checked.error?.message ?? "Especificação inválida"}`);
    else if (!issues.length) { checkedCount++; console.log(`✓ ${location.name} / ${filename}: catálogo e árvore válidos`); }
  } catch(e) { errors.push(`${filename}: erro de leitura/JSON: ${String(e)}`); }
}
}
if (errors.length) { for (const error of errors) console.error(`✗ ${error}`); process.exit(1); }
console.log(`✓ ${baseNames.length} contratos base + ${extensionNames.length} extensão(ões), ${checkedCount} especificações (telas + padrões) válidas.`);
