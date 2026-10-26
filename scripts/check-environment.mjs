#!/usr/bin/env node
/** True environment doctor. Does not pretend a checked-in lock/vendor exists. */
import {readFileSync,existsSync} from 'node:fs';
import {requiredItems} from './shadcn-plan.mjs';
const packageJson=JSON.parse(readFileSync('package.json','utf8'));
const strict=process.argv.includes('--strict');
const missing=requiredItems().filter(c=>!existsSync(`src/components/ui/${c.name}.tsx`));
const state={node:process.version,lockfile:existsSync('package-lock.json'),
 npmInstall:existsSync('node_modules/.package-lock.json'),
 missingShadcn:missing.map(x=>x.name),
 expectedDependencies:Object.keys(packageJson.dependencies).length,
 currentContracts:JSON.parse(readFileSync('pi-catalog/contracts.json','utf8')).components.length};
console.log(JSON.stringify(state,null,2));
if(!state.lockfile||!state.npmInstall||missing.length){
 console.warn('Ambiente não homologado. Procedimento: npm install --include=dev && npm run shadcn:install && npm run integration:update && npm run validate && npm run build');
 if(strict)process.exitCode=1;
}
