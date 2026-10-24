import {mkdirSync,writeFileSync} from 'node:fs';
import {catalog} from '../src/ui-catalog/catalog';
mkdirSync('reports/pi-eval',{recursive:true});
// Uses the actual catalog rather than manually maintaining potentially stale schema summaries.
writeFileSync('reports/pi-eval/catalog-prompt.txt',catalog.prompt({customRules:[
 'Return only a complete JSON object with root, elements, and optional state.',
 'Use only existing catalog components and actions; no TSX or markdown.',
 'Every component must provide the required schema props, including nullable fields.'
]}));
console.log('Prompt do catálogo exportado para avaliação com o Pi.');
