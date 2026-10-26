import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { resolve, relative, dirname, join, extname, sep } from "node:path";
import { createHash } from "node:crypto";
import { analyzeShadcnBlocks } from "./analyze-shadcn-blocks.mjs";
import {buildSemanticKnowledge} from "./semantic-knowledge.mjs";

const readJson = path => JSON.parse(readFileSync(path, "utf8"));
const unique = values => [...new Set(values)].sort((a, b) => a.localeCompare(b));
const kebab = name => name.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
const pascal = value => value.split("-").map(part => part[0]?.toUpperCase() + part.slice(1)).join("");
const hash = value => createHash("sha256").update(value).digest("hex");
const catalogDir = "src/ui-catalog/extensions/composites/";
const uiPrefix = "src/components/ui/";

export function extractImports(code) {
  // Imports and re-exports only; no evaluation, JSX execution, or dependency installation.
  return unique([...code.matchAll(/\bfrom\s*["']([^"']+)["']|\bimport\s*["']([^"']+)["']/g)]
    .map(match => match[1] ?? match[2]).filter(Boolean));
}

export function templatePrimitives(spec) {
  if (!spec || !spec.elements || typeof spec.elements !== "object") return [];
  return unique(Object.values(spec.elements)
    .map(node => node?.type).filter(type => typeof type === "string"));
}

export function classifyReuiDecision(decision, policy) {
  return policy.reuiDecisionActions[decision?.classification] ?? "review-required";
}

export function suggestCompositeImplementation(dependencies, signals) {
  // Heuristics generate review candidates, never an approved catalog contract.
  if (signals.remoteMedia) return "integration-review";
  if (signals.localState && signals.handlers) return "react-composite-candidate";
  if (dependencies.length > 1) return "declarative-composite-candidate";
  return "primitive-variation-candidate";
}

export function buildCompositionAnalysis(root = process.cwd()) {
  const dir = path => resolve(root, path);
  const errors = [];
  const policy = readJson(dir("src/ui-catalog/composition-policy.json"));
  const lock = readJson(dir("src/ui-catalog/contracts.lock.json"));
  const manifest = readJson(dir(catalogDir + "generated-manifest.json"));
  const families = readJson(dir("src/ui-catalog/reui-guidance.json"));
  const decisions = readJson(dir("src/ui-catalog/reui-semantic-admissions.json")).entries;
  const guidance = readJson(dir("src/ui-catalog/reui-example-guidance.pt-BR.json"));
  const approved = new Set(lock.components.map(entry => entry.name));
  const extensions = new Set(lock.components.filter(entry => entry.tier !== "base").map(entry => entry.name));
  const listedPrimitives = policy.primitiveExtensions;
  const listedReact = policy.reactComposites;
  const entries = [...listedPrimitives, ...listedReact, ...manifest.components.map(item => item.name)];
  const actualModules = readdirSync(dir("src/ui-catalog/extensions/components/"))
    .filter(file => file.endsWith(".tsx")).map(file => pascal(file.slice(0, -4))).sort();

  if (policy.schemaVersion !== 1) errors.push("composition-policy.json: schemaVersion unsupported");
  if (new Set(entries).size !== entries.length) errors.push("A contract belongs to multiple composition categories");
  if (new Set(entries).size !== extensions.size || entries.some(name => !extensions.has(name)))
    errors.push("Composition policy + generated manifest must classify every approved extension exactly once");
  if (JSON.stringify(unique([...listedPrimitives, ...listedReact])) !== JSON.stringify(actualModules))
    errors.push("Composition policy must classify every explicit React adapter, and no missing adapter is allowed");

  const modules = new Map();
  const canResolve = (base) => {
    const candidates = extname(base) ? [base] : [base + ".tsx", base + ".ts", base + ".mjs", base + ".jsx",
      base + ".js", join(base, "index.tsx"), join(base, "index.ts")];
    return candidates.find(path => existsSync(path) && statSync(path).isFile());
  };
  const inspectReact = (path, visiting = new Set()) => {
    const full = dir(path);
    if (modules.has(full)) return modules.get(full);
    if (visiting.has(full)) return [];
    if (!existsSync(full)) {
      errors.push("Missing React component: " + path);
      return [];
    }
    visiting.add(full);
    const code = readFileSync(full, "utf8");
    const primitives = [];
    for (const imported of extractImports(code)) {
      let resolved;
      if (imported.startsWith("@/")) resolved = dir("src/" + imported.slice(2));
      else if (imported.startsWith(".")) resolved = resolve(dirname(full), imported);
      else continue;
      const rel = relative(root, resolved);
      if (rel === ".." || rel.startsWith(".." + sep)) continue;
      if (rel.replaceAll("\\", "/").startsWith(uiPrefix)) {
        const component = rel.replaceAll("\\", "/").slice(uiPrefix.length).split("/")[0];
        primitives.push(pascal(component));
      } else {
        const child = canResolve(resolved);
        // Traversing local adapters discovers real primitive dependencies, not just direct imports.
        if (child && relative(root, child).replaceAll("\\", "/").startsWith("src/"))
          primitives.push(...inspectReact(relative(root, child), visiting));
      }
    }
    visiting.delete(full);
    const result = unique(primitives);
    modules.set(full, result);
    return result;
  };
  const sourceSignals = (path) => {
    const content = readFileSync(dir(path), "utf8");
    return {
      localState: /\b(?:useState|useReducer|useMachine)\s*\(/.test(content),
      handlers: /\bon(?:Click|Change|Select|Submit|OpenChange|ValueChange|CheckedChange)\s*=/.test(content),
      remoteMedia: /(?:src|href)\s*=\s*["']https?:\/\//.test(content),
      sourceHash: hash(content),
    };
  };

  const contracts = [];
  for (const item of manifest.components) {
    const path = catalogDir + "templates/" + item.template;
    if (!existsSync(dir(path))) {
      errors.push(item.name + ": missing declarative template " + path);
      continue;
    }
    contracts.push({
      name: item.name, kind: "composite", implementation: "declarative",
      sourcePath: path, dependencies: templatePrimitives(readJson(dir(path))),
      exposedToPi: approved.has(item.name),
    });
  }
  for (const name of [...listedPrimitives, ...listedReact]) {
    const path = "src/ui-catalog/extensions/components/" + kebab(name) + ".tsx";
    if (!existsSync(dir(path))) {
      errors.push(name + ": missing React adapter " + path);
      continue;
    }
    contracts.push({
      name, kind: listedPrimitives.includes(name) ? "primitive-adapter" : "composite",
      implementation: "react", sourcePath: path,
      dependencies: inspectReact(path), signals: sourceSignals(path),
      exposedToPi: approved.has(name),
    });
  }
  contracts.sort((a, b) => a.name.localeCompare(b.name));

  const shadcn = analyzeShadcnBlocks({
    root, inventory: readJson(dir("src/ui-catalog/block-source-inventory.json")),
    pins: readJson(dir("src/ui-catalog/shadcn-block-source-pins.json")),
    reviews: readJson(dir("src/ui-catalog/shadcn-block-decisions.json")),
    manifest, contracts, approved,
  });
  errors.push(...shadcn.errors);
  const shadcnBlocks = shadcn.blocks;

  const decisionById = new Map();
  for (const decision of decisions) {
    if (decisionById.has(decision.exampleId)) errors.push("Duplicate ReUI decision: " + decision.exampleId);
    decisionById.set(decision.exampleId, decision);
  }
  const examples = [];
  const expectedPaths = new Set(), seenIds = new Set();
  for (const [family, guide] of Object.entries(families)) {
    if (!Array.isArray(guide.examples)) {
      errors.push("Invalid ReUI examples in " + family);
      continue;
    }
    for (const [index, pair] of guide.examples.entries()) {
      const [title, id] = pair;
      const path = catalogDir + "reui-" + kebab(family) + "-" + (index + 1) + ".tsx";
      expectedPaths.add(path);
      if (seenIds.has(id)) errors.push("Duplicate ReUI ID " + id);
      seenIds.add(id);
      if (id !== "c-" + kebab(family) + "-" + (index + 1))
        errors.push(id + ": ReUI ID, family, and source order must agree");
      if (!existsSync(dir(path))) {
        errors.push(id + ": missing ReUI TSX " + path);
        continue;
      }
      if (!guidance[id]?.sourceUrl || guidance[id].language !== "pt-BR")
        errors.push(id + ": example guidance and source URL are required");
      const decision = decisionById.get(id);
      if (!decision || decision.family !== family || decision.title !== title ||
          !policy.reuiDecisionActions[decision.classification])
        errors.push(id + ": reviewed semantic admission decision is required; no automatic promotion");
      if (decision?.classification === "approved-semantic" &&
        (!approved.has(decision.contractName) || decision.reviewStatus !== "approved"))
        errors.push(id + ": semantic approval needs an existing approved Pi contract");
      const dependencies = inspectReact(path), signals = sourceSignals(path);
      examples.push({
        id, family, name: "Reui" + family + String(index + 1).padStart(2, "0"),
        title, sourcePath: path, implementation: "react-example", kind: "reui-example",
        dependencies, signals,
        suggestedImplementation: suggestCompositeImplementation(dependencies, signals),
        decision: decision?.classification ?? "review-required",
        recommendation: classifyReuiDecision(decision, policy),
        relatedContract: decision?.contractName ?? null,
        exposedToPi: false, // An existing semantic Pi contract is a separate artifact.
      });
    }
  }
  const reuiDir = dir(catalogDir);
  const actualPatterns = readdirSync(reuiDir)
    .filter(name => /^reui-[a-z-]+-\d+\.tsx$/.test(name))
    .map(name => catalogDir + name);
  for (const path of actualPatterns)
    if (!expectedPaths.has(path)) errors.push(path + ": unregistered ReUI TSX; add guidance and a reviewed admission decision");
  for (const key of Object.keys(guidance))
    if (!seenIds.has(key)) errors.push(key + ": orphan ReUI guidance");
  for (const key of decisionById.keys())
    if (!seenIds.has(key)) errors.push(key + ": orphan ReUI semantic decision");

  const usage = {};
  for (const record of [...contracts, ...examples]) {
    for (const component of record.dependencies) {
      const bucket = usage[component] ??= {contracts: [], reuiExamples: [], shadcnBlocks: []};
      bucket[record.kind === "reui-example" ? "reuiExamples" : "contracts"].push(
        record.kind === "reui-example" ? record.id : record.name);
    }
  }
  for (const record of shadcnBlocks) {
    for (const primitive of record.upstreamDependencies) {
      const bucket = usage[primitive] ??= {contracts: [], reuiExamples: [], shadcnBlocks: []};
      bucket.shadcnBlocks.push(record.name);
    }
  }
  for (const bucket of Object.values(usage)) {
    bucket.contracts = unique(bucket.contracts);
    bucket.reuiExamples = unique(bucket.reuiExamples);
    bucket.shadcnBlocks = unique(bucket.shadcnBlocks);
  }
  const semantic=buildSemanticKnowledge({root,contracts,reuiExamples:examples,approvedNames:approved});
  errors.push(...semantic.errors);
  return {
    report: {
      schemaVersion: 1, policySource: "src/ui-catalog/composition-policy.json",
      assurance: "Static dependency evidence only; not visual certification or automatic Pi admission.",
      totals: {
        approvedContracts: lock.components.length, declarativeComposites: manifest.components.length,
        reactComposites: listedReact.length, primitiveAdapters: listedPrimitives.length,
        reuiExamples: examples.length, reuiFamilies: Object.keys(families).length,
        shadcnBlocks: shadcnBlocks.length, upstreamSourceFiles: shadcn.sourceFiles,
        semanticProfiles: semantic.report.profiles.length, curatedSemanticProfiles: semantic.report.coverage.curatedOverlays,
      },
      contracts, reuiExamples: examples, shadcnBlocks, semanticKnowledge: semantic.report, primitiveImpact: Object.fromEntries(
        Object.entries(usage).sort(([a], [b]) => a.localeCompare(b))),
    }, errors: unique(errors),
  };
}
