import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
const read=p=>JSON.parse(readFileSync(p,'utf8'));
const inventory=read('src/ui-catalog/create-preview-inventory.json');
const audit=read('src/ui-catalog/create-reference-audit.json');
const strict=process.argv.includes('--strict');
const allowed=new Set(['read','reviewed']);
const cards=inventory.previews.flatMap(p=>p.cards);
 const screenByCard=new Map(inventory.previews.flatMap(p=>p.cards.map(c=>[c.id,p.screen])));
 const previewForCard=c=>screenByCard.get(c.id)+'.json';
const refs=new Map(audit.cards.map(x=>[x.name,x]));
const errors=[];
let awaiting=0;
if(cards.length!==64 || refs.size!==64)errors.push('O inventário e auditoria devem conter 64 cards');
for(const card of cards){
 const ref=refs.get(card.id);
 if(!ref){errors.push(`${card.id}: auditoria ausente`);continue;}
 if(ref.sourcePath!==card.sourcePath || !ref.sourceUrl.endsWith(card.sourcePath))errors.push(`${card.id}: arquivo de origem divergente`);
 if(!allowed.has(ref.sourceStatus))errors.push(`${card.id}: é obrigatória inspeção do código original`);
 if(!ref.originalTitle?.trim())errors.push(`${card.id}: título de origem ausente`);
 if(!ref.sourcePrimitiveImports?.length)errors.push(`${card.id}: primitivas originais não identificadas`);
 const spec=card.representation==='inline-primitives'?read(`src/ui-screens/${previewForCard(card)}`):read(card.templatePath);
 const root=card.representation==='inline-primitives'?spec.elements?.[card.inlineRoot]:spec.elements?.[spec.root];
 if(root?.props?.title!==ref.originalTitle)errors.push(`${card.id}: título visual divergente do original`);
 if(card.representation!=='inline-primitives'){
 const hash=createHash('sha256').update(readFileSync(card.templatePath)).digest('hex');
 if(hash!==ref.compositionHash)errors.push(`${card.id}: referência e template estão dessincronizados`);
 }
 if(ref.visualStatus!=='browser-reviewed'){
  awaiting++;
  if(strict)errors.push(`${card.id}: revisão visual pendente; faça screenshots das referências e compare os resultados`);
 } else if(!ref.visualEvidence?.reference || !existsSync(ref.visualEvidence.reference) || !ref.visualEvidence?.local || !existsSync(ref.visualEvidence.local)) {
  errors.push(`${card.id}: marcada como revisada sem screenshots de comparação verificáveis`);
 }
}
if(errors.length){for(const x of errors)console.error('✗ '+x);process.exit(1)}
console.log(`✓ ${cards.length} cards auditados contra fontes; ${awaiting} ainda requerem inspeção visual em navegador.${strict?'':''}`);
