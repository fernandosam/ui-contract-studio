import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

/** Split only reviewed top-level catalog entries; no runtime module execution. */
export function catalogSegments(){
  const inputs = [
    ['src/ui-catalog/catalog.ts','export const playgroundDefinitions = {','\n};','base'],
    ['src/ui-catalog/extensions/catalog.ts','export const extensionDefinitions = {','\n};','extension'],
  ];
  const values=[];
  for(const [file,start,end,tier] of inputs){
    const content=readFileSync(file,'utf8');
    const a=content.indexOf(start),b=content.indexOf(end,a+start.length);
    if(a<0||b<0)throw new Error(`${file}: bloco de catálogo não encontrado`);
    const body=content.slice(a+start.length,b);
    const matches=[...body.matchAll(/^ {2}([A-Za-z][A-Za-z0-9]*): \{/gm)];
    for(let i=0;i<matches.length;i++){
      const segment=body.slice(matches[i].index,i+1<matches.length?matches[i+1].index:body.length).trim();
      values.push({name:matches[i][1],tier,segment});
    }
  }
  return values;
}

/** Token-based semantic normalization. Whitespace/comments are insignificant outside
 * exact string/regexp literals; string contents and operators remain significant.
 * Historical byte fingerprints are retained for backward-compatible PR diffs.
 */
export function normalizedTokens(source){
  const tokens=[];let i=0, previous='';
  while(i<source.length){
    const c=source[i],next=source[i+1];
    if(/\s/.test(c)){i++;continue;}
    if(c==='/'&&next==='/'){i+=2;while(i<source.length&&source[i]!=='\n')i++;continue;}
    if(c==='/'&&next==='*'){i+=2;while(i<source.length&&!(source[i]==='*'&&source[i+1]==='/'))i++;i+=2;continue;}
    if(c==='"'||c==="'"||c==='`'){
      const quote=c,start=i++;let closed=false;
      while(i<source.length){if(source[i]==='\\'){i+=2;continue;}if(source[i++]===quote){closed=true;break;}}
      if(!closed)throw new Error('Literal sem fechamento no contrato');
      previous=source.slice(start,i);tokens.push(previous);continue;
    }
    // Zod source uses .regex(/.../). Preserve its literal including whitespace and classes.
    if(c==='/'&&['(','=',':',','].includes(previous)){
      const start=i++;let inClass=false,closed=false;
      while(i<source.length){
        if(source[i]==='\\'){i+=2;continue;}
        if(source[i]==='[')inClass=true;
        else if(source[i]===']')inClass=false;
        else if(source[i]==='/'&&!inClass){i++;while(/[a-z]/i.test(source[i]??'')&&i<source.length)i++;closed=true;break;}
        i++;
      }
      if(!closed)throw new Error('Regex sem fechamento no contrato');
      previous=source.slice(start,i);tokens.push(previous);continue;
    }
    if(/[A-Za-z_$\d]/.test(c)){
      const start=i++;while(i<source.length&&/[A-Za-z_$\d]/.test(source[i]))i++;
      previous=source.slice(start,i);tokens.push(previous);continue;
    }
    previous=c;tokens.push(c);i++;
  }
  return tokens;
}

export function signatures(){
 return catalogSegments().map(({name,tier,segment})=>({
   name,tier,
   fingerprint:createHash('sha256').update(segment).digest('hex'),
   semanticFingerprint:createHash('sha256').update(JSON.stringify(normalizedTokens(segment))).digest('hex'),
 }));
}
