#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';
import { signatures } from './lib/contract-lock.mjs';
const filename = 'src/ui-catalog/contracts.lock.json';
const approve = process.argv.includes('--approve-reviewed-change');
const current = signatures();
const previous = JSON.parse(readFileSync(filename, 'utf8'));
const prior = Object.fromEntries(previous.components.map(item => [item.name,item]));
const errors=[];
const approved = current.map(entry => {
  const known=prior[entry.name];
  if (!known) errors.push(`${entry.name}: contrato novo requer entrada versionada e revisão humana.`);
  if (known && known.tier!==entry.tier) errors.push(`${entry.name}: tier base/extension alterado.`);
  if (known && known.semanticFingerprint!==entry.semanticFingerprint) errors.push(`${entry.name}: semântica alterada; eleve a versão e revise os contratos.`);
  return known ? {...known, semanticFingerprint:entry.semanticFingerprint} : entry;
});
for(const name of Object.keys(prior)) if(!current.some(c=>c.name===name)) errors.push(`${name}: contrato retirado do lock sem migração.`);
if (approve) {
  if(!process.argv.includes('--human-reviewed')) {
    console.error('Registro protegido: --human-reviewed obrigatório; revisão externa/PR continua necessária.'); process.exit(1);
  }
  if (errors.length) { errors.forEach(e=>console.error('✗ '+e)); process.exit(1); }
  writeFileSync(filename,JSON.stringify({...previous,components:approved},null,2)+'\n');
} else if (errors.length) { errors.forEach(e=>console.error('✗ '+e)); process.exit(1); }
if(current.length!==previous.components.length){console.error('Quantidade de contratos divergente do lock de revisão.');process.exit(1)}
console.log(`✓ ${current.length} contratos versionados com fingerprints correspondentes.`);
