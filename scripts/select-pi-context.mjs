#!/usr/bin/env node
/** Least-privilege Pi context: real JSON Schema and actions for selected components only. */
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {buildSemanticKnowledge,selectAgentSemanticAdvice} from './lib/semantic-knowledge.mjs';
const read=p=>JSON.parse(readFileSync(p,'utf8'));
const all=read('pi-catalog/contracts.json');
const option=process.argv.find(x=>x.startsWith('--types='));
if(!option){console.error('Uso: npm run pi:context -- --types=Card,Button,Dashboard01 [--stdout] [--metadata-only]');process.exit(2)}
const names=[...new Set(option.slice('--types='.length).split(',').map(s=>s.trim()).filter(Boolean))];
if(!names.length||names.length>25){console.error('Selecione entre 1 e 25 tipos por lote.');process.exit(2)}
const metadataOnly=process.argv.includes('--metadata-only');
const schemaPath='pi-catalog/props-json-schema.json';
if(!metadataOnly&&!existsSync(schemaPath)){
 console.error('JSON Schema real ausente. Execute npm install --include=dev && npm run pi:zod-schema. Use --metadata-only somente para inspeção, não geração.');
 process.exit(2);
}
const schema=metadataOnly?null:read(schemaPath);
if(schema&&(schema.schemaVersion!==2||schema.projectVersion!==all.projectVersion||schema.catalogSize!==all.catalogSize||!schema.types||!schema.actions||!schema.events)){
 console.error('Arquivo de schemas incompatível; regenere com npm run pi:zod-schema.');process.exit(1);
}
const selected=[];
for(const name of names){
 const contract=all.contracts.find(x=>x.type===name);
 if(!contract){const retired=read('pi-catalog/retired-contracts.json').retired.find(c=>c.name===name);console.error(retired?`Tipo removido na v0.21: ${name}. ${retired.reason} Use ${retired.replacement}.`:`Tipo não aprovado: ${name}. Consulte pi-catalog/contracts.json.`);process.exit(1)}
 const shape=schema?.types[name];
 if(schema&&!shape){console.error(`${name}: schema ausente/desatualizado. Execute npm run pi:zod-schema.`);process.exit(1)}
 selected.push({contract, ...(shape?{propsSchema:shape,events:schema.events[name]??[]}:{}),example:read(contract.example)});
}
const semantic=buildSemanticKnowledge({approvedNames:new Set(all.contracts.map(x=>x.type))});
if(semantic.errors.length){
 semantic.errors.forEach(e=>console.error('✗ '+e));process.exit(1);
}
const semanticAdvice=selectAgentSemanticAdvice(semantic.report,names);
const pack={schemaVersion:2,catalogVersion:all.projectVersion,metadataOnly,rules:[
 'Retorne somente JSON com root e elements; todos os nós DEVEM conter children como array, mesmo sem filhos.',
 'Use APENAS os tipos selecionados e propriedades do propsSchema; additionalProperties false é obrigatório.',
 'Use APENAS os eventos previstos para os tipos selecionados e as ações declaradas em actions.',
 'Content é opcional e suas chaves devem existir em properties.content.properties.',
 'nodeProps permite dados estruturados (listas, gráficos, tabelas, opções e navegação) somente nas chaves previstas por propsSchema.properties.nodeProps. NÃO altere type, children, on, name, href, src ou sourceId.',
 'Não invente JSX, URLs remotas, credenciais, dados privados, operações externas ou backend.',
 'Antes de aplicar, valide com npm run pi:validate -- --file=<spec.json>. Corrija caminhos informados em issues[].pointer.',
 ], actions:all.actions, ...(schema?{actionSchemas:schema.actions}:{}),selected, semanticAdvice, semanticAdvicePolicy:"Advisory only; no new props, type, event, external action, data source or permission. propsSchema and actionSchemas remain authoritative."};
const output=JSON.stringify(pack,null,2)+'\n';
const dest=process.argv.find(x=>x.startsWith('--out='))?.slice(6)??'reports/pi-context/selected.json';
if(process.argv.includes('--stdout')) process.stdout.write(output);
else {
 if(!dest.startsWith('reports/pi-context/')||!dest.endsWith('.json')||dest.includes('..')||resolve(dest)===resolve('reports/pi-context/')){
  console.error('Saída permitida: reports/pi-context/*.json');process.exit(2);
 }
 mkdirSync('reports/pi-context',{recursive:true});writeFileSync(dest,output);console.log(`Gerado ${dest} (${names.length} tipos, schema=${Boolean(schema)})`);
}
