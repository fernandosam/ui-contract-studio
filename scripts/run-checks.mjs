#!/usr/bin/env node
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

/** Single process orchestration; original focused scripts remain independently runnable.
 * --core runs inexpensive catalog/policy checks; full mode runs all current gates.
 */
const core=[
  'check-dependency-compat.mjs','check-contract-versions.mjs',
  'build-pi-api.mjs --check','build-pi-fixtures.mjs --check',
  'check-readiness.mjs','check-composite-pruning.mjs','check-screen-discovery.mjs',
  'check-ui-catalog.ts','sync-admission-catalog.mjs --check','admission-engine.mjs --check','check-composition-recommendations.ts','generate-composition-proposals.mjs --check','analyze-semantic-knowledge.mjs --check','analyze-compositions.mjs','generate-composite-registry.mjs --check','generate-composite-node-props.mjs --check',
  'check-boundaries.ts',
];
const extended=[
  'check-composite-fingerprints.mjs','check-composite-templates.ts',
  'check-shadcn-blocks.mjs','check-site-compositions.mjs',
  'check-shadcn-install.mjs','check-shadcn-integrity.mjs',
  'check-extension-dependencies.mjs','check-ui-patterns.mjs','generate-integration-status.mjs --check',
];
const tasks=process.argv.includes('--core')?core:[...core,...extended];
const bin=resolve('node_modules/.bin/tsx');
let done=0;
for(const task of tasks){
 const [name,...params]=task.split(' ');
 const useTsx=name.endsWith('.ts');
 if(useTsx&&!existsSync(bin)){
  console.error(`✗ ${name}: tsx não instalado (npm ci). Verificação não foi pulada.`);process.exit(1);
 }
 const argumentsList=useTsx?[bin,resolve('scripts',name),...params]:[resolve('scripts',name),...params];
 const result=spawnSync(process.execPath,argumentsList,{stdio:'inherit'});
 if(result.status!==0){console.error(`✗ ${name} falhou: ${result.status??result.error?.message}`);process.exit(result.status??1)}
 done++;
}
console.log(`✓ ${done} verificações concluídas sem repetição de comandos npm`);
