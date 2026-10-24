import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { items } from './shadcn-plan.mjs';
const strict=process.argv.includes('--strict');
const missing=[];
for(const item of items) {
 const file=resolve(`src/components/ui/${item.name}.tsx`);
 if(!existsSync(file)) {missing.push(item.name);continue;}
 const content=readFileSync(file,'utf8');
 if(!content.includes('export ') || content.length < 100) {
   console.error(`Arquivo shadcn suspeito: ${item.name}`);process.exitCode=1;
 }
}
const lock=existsSync('package-lock.json');
if (!lock) {console.warn('package-lock.json ausente; npm ci e build reproduzível aguardam instalação conectada.');if(strict)process.exitCode=1;}
if(missing.length){console.warn(`Primitivas ausentes: ${missing.join(', ')}`);if(strict)process.exitCode=1;}
console.log(`Verificação estática shadcn: ${items.length-missing.length}/${items.length}; lockfile: ${lock?'sim':'não'}.`);
console.log('Instalação e compatibilidade só são confirmadas por npm ci + tsc + build + E2E.');
