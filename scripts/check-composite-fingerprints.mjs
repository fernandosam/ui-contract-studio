#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const read = path=>JSON.parse(readFileSync(path,'utf8'));
const inv=read('src/ui-catalog/create-preview-inventory.json');
const lock=read('src/ui-catalog/contracts.lock.json');
let count=0;
const errors=[];
for(const preview of inv.previews)for(const card of preview.cards){
  count++;
  if(card.representation==='inline-primitives')continue;
  const entry=lock.components.find(x=>x.name===card.id);
  if(!entry || !entry.compositionHash){errors.push(`${card.id}: sem hash de composição`);continue;}
  const hash=createHash('sha256').update(readFileSync(card.templatePath)).digest('hex');
  if(hash!==entry.compositionHash) errors.push(`${card.id}: template mudou sem revisão/hash atualizado`);
  const contents=read(card.templatePath);
  if(contents.elements?.[contents.root]?.type!=='Card')errors.push(`${card.id}: composição sem card raiz`);
}
if(count!==64)errors.push(`Esperados 64 cards de referência: ${count}`);
if(errors.length){for(const x of errors)console.error('✗ '+x);process.exit(1);}
console.log(`✓ ${count} composições com integridade SHA-256 verificada.`);
