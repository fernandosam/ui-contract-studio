#!/usr/bin/env node
/** Conta evidências reais de CI: não deduz aprovação de prints inexistentes. */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { createHash } from 'node:crypto';
const read = path => JSON.parse(readFileSync(path, 'utf8'));
const strict = process.argv.includes('--strict');
// Galerias 1/2 removidas: evidências de referência são restritas às primitivas oficiais.
const cards = [];
const viewports = ['desktop', 'mobile'];
const required = viewports.flatMap(viewport => cards.map(card => ({
  viewport, id: card.id,
  local: `reports/gallery-fidelity/local/${viewport}/${card.id}.png`,
  reference: `reports/gallery-fidelity/reference/${viewport}/${card.id}.png`,
})));
const missingLocal = required.filter(item => !existsSync(item.local));
const missingReference = required.filter(item => !existsSync(item.reference));
// Component demos on ui.shadcn.com are a distinct reference set from the 64 create cards.
const officialDocsPath = 'reports/official-components/comparison.json';
const officialDocs = existsSync(officialDocsPath) ? read(officialDocsPath) : null;
const lockPath = 'package-lock.json';
const root = 'src/components/ui';
const primitives = read('shadcn-plan.json').groups.flatMap(group => group.items.map(item => item.name));
const missingPrimitives = primitives.filter(name => !existsSync(`${root}/${name}.tsx`));
const fingerprint = existsSync(lockPath)
  ? createHash('sha256').update(readFileSync(lockPath)).digest('hex') : null;
const result = {
  schemaVersion: 1,
  catalogContracts: read('pi-catalog/contracts.json').components.length,
  expectedCardsPerViewport: cards.length,
  expectedScreenshotCount: required.length,
  actualScreenshotCount: required.length - missingLocal.length,
  missingLocalScreenshots: missingLocal.map(item => item.local),
  officialReferenceCount: required.length - missingReference.length,
  missingOfficialReferences: missingReference.map(item => item.reference),
  officialComponentExamples: officialDocs
    ? {
        source: 'https://ui.shadcn.com/docs/components',
        expectedPairs: officialDocs.expectedCases,
        comparedPairs: officialDocs.comparedCases,
        expectedComparablePairs: officialDocs.expectedComparableCases,
        officialOnlyCases: officialDocs.officialOnlyCases,
        unmappedComponents: officialDocs.unmappedComponents,
        missingPairs: officialDocs.missingCases,
        equivalence: 'different-demo-content; diagnostic comparison only',
        report: officialDocsPath,
      }
    : {status:'not-run',report:officialDocsPath},
  visualApproval: officialDocs && officialDocs.expectedCases > 0 && officialDocs.missingCases === 0 &&
    officialDocs.comparedCases + officialDocs.officialOnlyCases === officialDocs.expectedCases &&
    missingLocal.length === 0 && missingReference.length === 0
    ? 'comparison-and-human-review-required' : 'pending',
  lockfileSha256: fingerprint,
  requiredPrimitiveCount: primitives.length,
  missingPrimitives,
};
const destination = 'reports/github-actions/visual-evidence.json';
mkdirSync(dirname(destination), {recursive:true});
writeFileSync(destination, JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify({
  report:destination,
  contracts: result.catalogContracts,
  captured:result.actualScreenshotCount,
  expected:result.expectedScreenshotCount,
  missingOfficialReferences:missingReference.length,
  missingShadcn:missingPrimitives.length,
  lockfile: Boolean(fingerprint),
  visualApproval:result.visualApproval,
  officialDocsCompared:officialDocs?.comparedCases ?? 0,
  officialDocsExpected:officialDocs?.expectedCases ?? 76,
  officialDocsExpectedComparable:officialDocs?.expectedComparableCases ?? 58,
},null,2));
if (strict && (!fingerprint || missingPrimitives.length || missingLocal.length)) process.exitCode = 1;
