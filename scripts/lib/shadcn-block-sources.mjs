import { createHash } from "node:crypto";
import { extractImports, suggestCompositeImplementation } from "./composition-analysis.mjs";

const sha256 = content => createHash("sha256").update(content).digest("hex");
export const gitBlobSha = content => createHash("sha1").update("blob " + Buffer.byteLength(content, "utf8") + "\0").update(content).digest("hex");
const unique = xs => [...new Set(xs)].sort((a,b) => a.localeCompare(b));
const uiModule = path => path.match(/(?:^|\/)(?:ui|components\/ui)\/([a-z0-9-]+)(?:\.[cm]?[jt]sx?)?$/)?.[1];
const pascal = value => value.split("-").map(part => part.slice(0,1).toUpperCase() + part.slice(1)).join("");

export function summarizeShadcnBlockSources(block, sourceFiles, revision) {
  const expected = [...block.sourceFiles].sort();
  const supplied = sourceFiles.map(entry => entry.path).sort();
  if (new Set(supplied).size !== expected.length || JSON.stringify(expected) !== JSON.stringify(supplied))
    throw new Error(block.name + ": original TSX/JSON inventory must match all supplied source files");
  if (!/^[0-9a-f]{40}$/.test(revision)) throw new Error("Pin an immutable upstream Git commit SHA");
  const files = sourceFiles.map(({path,content}) => {
    if (typeof content !== "string") throw new Error("Missing upstream source content for " + path);
    const imports = extractImports(content);
    return {
      path, sha256: sha256(content),
      imports, primitives: unique(imports.map(uiModule).filter(Boolean).map(pascal)),
      externalPackages: unique(imports.filter(value => !value.startsWith("@/") && !value.startsWith(".") && !value.startsWith("/"))),
      signals: {
        localState: /\b(?:useState|useReducer)\s*\(/.test(content),
        handlers: /\bon(?:Click|Change|Submit|Select|OpenChange|ValueChange|CheckedChange)\s*=/.test(content),
        remoteMedia: /(?:src|href)\s*=\s*["']https?:\/\//.test(content),
      },
    };
  }).sort((a,b)=>a.path.localeCompare(b.path));
  const dependencies = unique(files.flatMap(x=>x.primitives));
  const externals = unique(files.flatMap(x=>x.externalPackages));
  const signals = {
    localState: files.some(x=>x.signals.localState),
    handlers: files.some(x=>x.signals.handlers),
    remoteMedia: files.some(x=>x.signals.remoteMedia),
  };
  return {
    schemaVersion:1, id:block.id, name:block.name, upstreamCommit:revision,
    upstreamUrl:"https://github.com/shadcn-ui/ui/tree/" + revision + "/apps/v4/registry/bases/base/blocks/" + block.name,
    sourceFiles:files, dependencies, externalPackages:externals, signals,
    suggestedImplementation:suggestCompositeImplementation(dependencies,signals),
    fingerprint:sha256(JSON.stringify(files.map(x=>[x.path,x.sha256,x.imports]))),
  };
}

export function validateShadcnSourceEvidence(block, evidence) {
  const errors = [];
  if (!evidence || evidence.schemaVersion !== 1 || evidence.id !== block.id || evidence.name !== block.name)
    return [block.name + ": official source-analysis evidence absent or invalid"];
  const actualPaths = (evidence.sourceFiles ?? []).map(file=>file.path);
  if (new Set(actualPaths).size !== block.sourceFiles.length ||
      JSON.stringify([...actualPaths].sort()) !== JSON.stringify([...block.sourceFiles].sort()))
    errors.push(block.name + ": upstream source files changed; regenerate source evidence");
  if (!/^[a-f0-9]{40}$/.test(evidence.upstreamCommit ?? ""))
    errors.push(block.name + ": missing immutable upstream commit");
  for(const file of evidence.sourceFiles ?? []){
    if (!/^[a-f0-9]{64}$/.test(file.sha256 ?? "") || !Array.isArray(file.imports))
      errors.push(block.name + ": source hash or imports missing for " + file.path);
    const expectedPrimitives=unique((file.imports??[]).map(uiModule).filter(Boolean).map(pascal));
    if(JSON.stringify(file.primitives)!==JSON.stringify(expectedPrimitives))
      errors.push(block.name + ": primitive imports inconsistent in " + file.path);
  }
  const files=evidence.sourceFiles ?? [];
  const deps=unique(files.flatMap(x=>x.primitives??[]));
  const externals=unique(files.flatMap(x=>x.externalPackages??[]));
  if(JSON.stringify(evidence.dependencies)!==JSON.stringify(deps))
    errors.push(block.name + ": upstream primitive dependency map is inconsistent");
  if(JSON.stringify(evidence.externalPackages)!==JSON.stringify(externals))
    errors.push(block.name + ": external dependencies inconsistent");
  const signals={
    localState:files.some(x=>x.signals?.localState),
    handlers:files.some(x=>x.signals?.handlers),
    remoteMedia:files.some(x=>x.signals?.remoteMedia),
  };
  if(JSON.stringify(evidence.signals)!==JSON.stringify(signals) ||
      evidence.suggestedImplementation!==suggestCompositeImplementation(deps,signals))
    errors.push(block.name + ": source signals/recommendation inconsistent");
  const fingerprint=sha256(JSON.stringify(files.map(x=>[x.path,x.sha256,x.imports])));
  if(evidence.fingerprint!==fingerprint)
    errors.push(block.name + ": source evidence fingerprint mismatch");
  if(evidence.upstreamUrl!=="https://github.com/shadcn-ui/ui/tree/" + evidence.upstreamCommit +
    "/apps/v4/registry/bases/base/blocks/" + block.name)
    errors.push(block.name + ": source URL is not pinned to the analyzed commit");
  return errors;
}
