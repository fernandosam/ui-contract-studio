#!/usr/bin/env node
/** Local-only visual audit page. Reference PNGs are supplied by the reviewer, not fetched. */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
const inv=JSON.parse(readFileSync('src/ui-catalog/create-preview-inventory.json','utf8'));
const audit=JSON.parse(readFileSync('src/ui-catalog/create-reference-audit.json','utf8'));
const refs=new Map(audit.cards.map(c=>[c.name,c]));
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const sections=[];
for(const pv of inv.previews){
 const cards=pv.cards.map((c,i)=>{
  const ref=refs.get(c.id);
  const local=`local/desktop/${pv.screen}-${String(i+1).padStart(2,'0')}-${c.id}.png`;
  const reference=`reference/${c.id}.png`;
  return `<section class="card"><header><h2>${esc(c.id)}</h2><a target="_blank" rel="noopener noreferrer" href="${esc(ref.sourceUrl)}">JSX original ↗</a><span>${esc(ref.visualStatus)}</span></header><div class="pictures"><figure><figcaption>Referência (salvar em ${esc(reference)})</figcaption><img src="${esc(reference)}" alt="Referência oficial de ${esc(c.id)}" /></figure><figure><figcaption>Implementação local</figcaption><img src="${esc(local)}" alt="Implementação local de ${esc(c.id)}" /></figure></div><p>Comparar hierarquia, dimensões, tipografia, espaçamento, cores, controles e estados. Não aprovar se faltarem evidências.</p></section>`;
 }).join('\n');
 sections.push(`<h2 class="group">${esc(pv.name)} · ${pv.cards.length} cards</h2>${cards}`);
}
const page=`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>Auditoria visual shadcn/create</title><style>body{margin:auto;max-width:1400px;padding:30px;font:14px system-ui;background:#f6f6f6;color:#18181b}h1{font-size:26px}h2.group{margin-top:36px}.card{padding:20px;margin:20px 0;background:white;border:1px solid #ddd;border-radius:14px}header{display:flex;align-items:center;gap:20px;flex-wrap:wrap}header h2{font-size:17px}header span{color:#666}.pictures{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px}figure{margin:0;border:1px dashed #bbb;padding:12px;border-radius:12px;min-height:150px;overflow:auto}figcaption{margin-bottom:10px;font-size:12px;color:#555}img{display:block;max-width:100%;height:auto}p{font-size:12px;color:#6b7280}@media(max-width:700px){.pictures{grid-template-columns:1fr}body{padding:12px}}</style></head><body><h1>Auditoria visual — shadcn/create</h1><p>Gerado para facilitar comparação manual. Capturas de referência devem ser obtidas legalmente pelo revisor no site oficial; sua ausência não indica aprovação.</p>${sections.join('\n')}</body></html>`;
mkdirSync('reports/visual-review',{recursive:true});
writeFileSync('reports/visual-review/compare.html',page);
console.log('reports/visual-review/compare.html criado (64 cards).');
