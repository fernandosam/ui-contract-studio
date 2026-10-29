import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

/** Split only reviewed top-level catalog entries; no runtime module execution. */
export function catalogSegmentsFromContents(baseSource, extensionSource) {
  const values=[];
  for(const [source,start,end,tier] of [
    [baseSource,'export const playgroundDefinitions = {','\n};','base'],
    [extensionSource,'export const extensionDefinitions = {','\n};','extension'],
  ]){
    const a=source.indexOf(start),b=source.indexOf(end,a+start.length);
    if(a<0||b<0)throw new Error(tier+': bloco de catálogo não encontrado');
    const body=source.slice(a+start.length,b);
    const matches=[...body.matchAll(/^ {2}([A-Za-z][A-Za-z0-9]*): \{/gm)];
    for(let i=0;i<matches.length;i++){
      const segment=body.slice(matches[i].index,i+1<matches.length?matches[i+1].index:body.length).trim();
      values.push({name:matches[i][1],tier,segment});
    }
  }
  return values;
}

/** Split only reviewed top-level catalog entries; no runtime module execution. */
export function catalogSegments(){
  return catalogSegmentsFromContents(
    readFileSync('src/ui-catalog/catalog.ts','utf8'),
    readFileSync('src/ui-catalog/extensions/catalog.ts','utf8'),
  );
}

/** Token-based semantic normalization. Whitespace/comments are insignificant outside
 * exact string/regexp literals; string contents and operators remain significant.
 * Versioning relies solely on semantic fingerprints, not historical byte hashes.
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
   semanticFingerprint:createHash('sha256').update(JSON.stringify(normalizedTokens(segment))).digest('hex'),
 }));
}
