import {writeFileSync,mkdirSync} from 'node:fs';
const output='src/ui-catalog/extensions/composites';
mkdirSync(output,{recursive:true});
const imports=[];
for(let n=1;n<=61;n++){
 const url='https://raw.githubusercontent.com/keenthemes/reui/main/registry-reui/bases/base/components/button/c-button-'+n+'.tsx';
 const response=await fetch(url);
 if(!response.ok)throw new Error(url+': '+response.status);
 let source=await response.text();
 if(!source.includes('export default function Pattern'))throw new Error('Unexpected ReUI source '+n);
 source=source.replaceAll('@/registry/bases/base/ui/','@/components/ui/');
 source=source.replaceAll('@/registry-reui/bases/base/hooks/use-copy-to-clipboard','./reui-button-adapters');
 source=source.replaceAll('@/app/(create)/components/icon-placeholder','./reui-button-adapters');
 source=source.replaceAll('from "@remixicon/react"','from "./reui-button-adapters"');
 source=source.replaceAll('https://github.com/shadcn.png','');
 source=source.replace(/<AvatarImage[^>]+\/>/g,'');
 source=source.replace(/^\s*AvatarImage,?\s*$/gm,'');
 source=source.replace('export default function Pattern()', 'export function ReuiButtonPattern'+n+'()');
 source=source.replaceAll('href="/"','href="#reui-button-demo"').replaceAll('href="#"','href="#reui-button-demo"');
 writeFileSync(output+'/reui-button-'+n+'.tsx',source);
 imports.push('import {ReuiButtonPattern'+n+'} from "./reui-button-'+n+'";');
}
writeFileSync(output+'/reui-button-index.ts',imports.join('\n')+'\nexport const reuiButtonPatterns=['+Array.from({length:61},(_,i)=>'ReuiButtonPattern'+(i+1)).join(',')+'] as const;\n');
console.log('Imported 61 ReUI Button example modules');
