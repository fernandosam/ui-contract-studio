#!/usr/bin/env node
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { graphErrors } from './lib/spec-invariants.mjs';
import { signatures } from './lib/contract-lock.mjs';
const read = p => JSON.parse(readFileSync(p,'utf8'));
const audit = read('src/ui-catalog/site-compositions-audit.json');
const lock = read('src/ui-catalog/contracts.lock.json');
const sources = read('src/ui-catalog/sources.json');
const names = new Set(lock.components.map(x => x.name));
const base = lock.components.filter(x => x.tier === 'base').map(x => x.name);
const previous=lock.components.filter(x=>x.tier==='base'||['DataTable','DatePicker','Field','BlockSidebar'].includes(x.name)||/^(Dashboard01|Login0[1-5]|Signup0[1-5]|Sidebar(?:0[1-9]|1[0-6]))$/.test(x.name)).map(x=>x.name);
const allowed = new Set([...base,...previous]);
const admitted = audit.files.filter(x => x.decision === 'admitted');
const excluded = audit.files.filter(x => x.decision === 'excluded');
const errors=[];
if(audit.total!==75 || audit.files.length!==75 || admitted.length!==15 || excluded.length!==60) errors.push('Inventário deve cobrir exatamente 75 fontes, com 15 admissões e 60 exclusões');
if(names.size!==lock.components.length || lock.components.length!==sources.components.length)errors.push('Catálogo deve conter 163 tipos sem duplicatas');
if(new Set(audit.files.map(x=>x.path)).size!==75)errors.push('Fontes duplicadas');
for(const f of audit.files){
 if(!f.path.startsWith('apps/v4/components/') || !f.url.endsWith(f.path))errors.push(`${f.name}: URL de origem inválida`);
 if(f.decision==='excluded' && (!f.reason || !f.reason.trim()))errors.push(`${f.name}: exclusão sem justificativa`);
}
for(const c of admitted){
 const entry=lock.components.find(x=>x.name===c.type);
 const origin=sources.components.find(x=>x.name===c.type);
 if(!entry || !origin) {errors.push(`${c.type}: contrato/manifesto ausente`);continue;}
 if(!c.templatePath||!c.componentPath||!existsSync(c.templatePath)||!existsSync(c.componentPath)) {errors.push(`${c.type}: template ou componente ausente`);continue;}
 const buffer=readFileSync(c.templatePath), digest=createHash('sha256').update(buffer).digest('hex');
 if(digest!==c.compositionHash || digest!==entry.compositionHash) errors.push(`${c.type}: checksum de template divergente`);
 const spec=JSON.parse(buffer);
 const issues=graphErrors(spec,[...allowed],{allowedActions:['buttonClick','formSubmit','linkClick','setState','pushState','removeState']});
 errors.push(...issues.map(x=>`${c.type}: ${x}`));
 if(spec.elements[spec.root]?.type!=='Card')errors.push(`${c.type}: raiz da composição deve ser Card`);
 if(Object.values(spec.elements).some(x=>!allowed.has(x.type)))errors.push(`${c.type}: template usa tipos ainda não aprovados`);
 const sample=read(`src/ui-explorer-samples/${c.type}.json`);
 if(sample.elements[sample.root]?.type!==c.type)errors.push(`${c.type}: amostra isolada ausente`);
 if(process.argv.includes('--strict')) {
  if(c.visualStatus!=='screenshot-compared')errors.push(`${c.type}: comparação visual por screenshots pendente`);
  const evidence=c.visualEvidence;
  if(!evidence || !evidence.reference || !evidence.local || !evidence.reviewer || !evidence.date || !existsSync(evidence.reference) || !existsSync(evidence.local)) errors.push(`${c.type}: fotos reais, data e revisor obrigatórios`);
 }
}
for(const s of signatures())if(lock.components.find(x=>x.name===s.name)?.fingerprint!==s.fingerprint)errors.push(`${s.name}: fingerprint de schema divergente`);
if(errors.length){errors.forEach(x=>console.error('✗ '+x));process.exit(1);}
console.log(`✓ ${audit.files.length} fontes auditadas (15 compostos/60 exclusões); ${lock.components.length} contratos íntegros. Revisão visual por screenshots pendente.`);
