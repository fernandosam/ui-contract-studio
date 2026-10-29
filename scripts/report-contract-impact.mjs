#!/usr/bin/env node
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {analyzeContractImpact,impactMarkdown} from './lib/contract-impact.mjs';

const source='reports/contract-diff/changes.json';
try {
  const diff=JSON.parse(readFileSync(source,'utf8'));
  if (!Array.isArray(diff.changes)) throw new Error('Invalid structural diff report');
  const report=analyzeContractImpact({
    changes:diff.changes,baseCommit:diff.baseCommit,
    valid:diff.valid,upstreamErrors:diff.errors??[],
  });
  mkdirSync('reports/contract-diff',{recursive:true});
  writeFileSync('reports/contract-diff/impact.json',JSON.stringify(report,null,2)+'\n');
  writeFileSync('reports/contract-diff/impact.md',impactMarkdown(report));
  console.log('E07 consumer impact: '+JSON.stringify(report.totals));
  console.log('Reports: reports/contract-diff/impact.json and impact.md');
  for(const issue of [...report.diagnostics,...report.errors])console.error('! '+issue);
  // Existing contract diff is the blocking SemVer check; reporting is
  // diagnostic unless its own input/indexing is malformed.
  if (report.errors.some(e=>!diff.errors?.includes(e))) process.exitCode=1;
}catch(error) {
  console.error('Cannot generate contract impact: '+error.message);
  process.exitCode=1;
}
