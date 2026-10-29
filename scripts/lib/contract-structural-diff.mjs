/**
 * Read-only, deterministic source diff of the reviewed JSON-safe catalog contracts.
 * No eval, no Zod execution and no admission decisions. Unknown syntax is explicit,
 * never silently treated as a compatible API change.
 */
import { normalizedTokens } from './contract-lock.mjs';

const matching = { ')':'(', ']':'[', '}':'{' };
const opens = new Set(['(', '[', '{']);
const stateNames = /^(?:open|defaultOpen|value|defaultValue|checked|defaultChecked|selected|selectedIds|active|status|state|loading|expanded|disabled|error|pending|defaultOpenId)$/i;
const sorted = values => [...values].sort((a,b) => a.localeCompare(b, 'en'));
const signature = tokens => tokens.join('');
const brief = text => text === undefined ? undefined : text.slice(0,240);

/** Split comma-separated expressions at depth zero, including nested calls. */
function split(tokens) {
  const parts = [], stack = [];
  let start = 0;
  for (let i=0; i<tokens.length; i++) {
    const token=tokens[i];
    if (opens.has(token)) stack.push(token);
    else if (token in matching && stack.pop()!==matching[token]) return null;
    if (token===',' && stack.length===0) {
      if (i>start) parts.push(tokens.slice(start,i));
      start=i+1;
    }
  }
  if (stack.length) return null;
  if (start<tokens.length) parts.push(tokens.slice(start));
  return parts;
}

function objectFields(tokens) {
  if (tokens[0]!=='{' || tokens.at(-1)!=='}') return null;
  const items=split(tokens.slice(1,-1));
  if (!items) return null;
  const fields=new Map();
  for (const item of items) {
    const colon=item.indexOf(':');
    const key=item[0];
    if (colon!==1 || !/^[a-zA-Z_$][\w$]*$/.test(key??'') || fields.has(key)) return null;
    fields.set(key,item.slice(2));
  }
  return fields;
}

function objectAt(tokens, start) {
  if (tokens[start]!=='{') return null;
  const stack=[];
  for(let i=start;i<tokens.length;i++) {
    const t=tokens[i];
    if(opens.has(t)) stack.push(t);
    else if(t in matching && stack.pop()!==matching[t]) return null;
    if(!stack.length) return {start,end:i,fields:objectFields(tokens.slice(start,i+1))};
  }
  return null;
}

function objectSchema(tokens) {
  // Multiple union variants cannot be flattened safely into a single shape.
  const ambiguous=tokens.findIndex(t=>t==='union'||t==='discriminatedUnion');
  for (let i=0;i<tokens.length-2;i++) {
    const helper=['obj','strict'].includes(tokens[i]) && tokens[i+1]==='(' && tokens[i+2]==='{';
    const zod=tokens[i]==='z' && tokens[i+1]==='.' && tokens[i+2]==='object' &&
       tokens[i+3]==='(' && tokens[i+4]==='{';
    if(helper || zod) {
      if(ambiguous>=0 && ambiguous<i) return null;
      const shape=objectAt(tokens,i+(helper?2:4));
      if(shape?.fields) return shape;
      return null;
    }
  }
  return null;
}

function emit(map, category, path, tokens) {
  map.set(category+':'+path,{category,path,signature:signature(tokens)});
}

function walkSchema(map,path,tokens,depth=0) {
  if (depth>15) {emit(map,'structure',path+'.depth',tokens);return;}
  const category=stateNames.test(path.replaceAll('[]','').split('.').at(-1)??'')?'state':'property';
  const shape=objectSchema(tokens);
  const normalized=shape
    ? [...tokens.slice(0,shape.start+1),'__fields__',...tokens.slice(shape.end)]
    : tokens;
  emit(map,category,path,normalized);
  if (!shape) return;
  const arraySuffix=signature(tokens.slice(0,shape.start)).includes('array(')?'[]':'';
  for(const key of sorted(shape.fields.keys()))
    walkSchema(map,path+arraySuffix+'.'+key,shape.fields.get(key),depth+1);
}

function literalList(tokens) {
  if (tokens[0]!=='[' || tokens.at(-1)!==']') return null;
  const parts=split(tokens.slice(1,-1));
  if (!parts) return null;
  const result=[];
  for(const item of parts) {
    if (item.length!==1 || !/^(?:".*"|'.*')$/s.test(item[0])) return null;
    try {
      result.push(item[0][0]==='"' ? JSON.parse(item[0]) : item[0].slice(1,-1));
    } catch {return null;}
  }
  return result;
}

function flatten(segment) {
  const out=new Map();
  if(typeof segment!=='string') {
    emit(out,'structure','$component',[String(segment)]);
    return out;
  }
  const tokens=normalizedTokens(segment);
  const start=tokens.indexOf('{');
  const shape=objectAt(tokens,start);
  if (!shape?.fields) {
    emit(out,'structure','$component',tokens);
    return out;
  }
  for(const name of sorted(shape.fields.keys())) {
    const value=shape.fields.get(name);
    if(name==='props') {
      const props=objectSchema(value);
      if(!props) {
        emit(out,'structure','props',value);
      } else {
        emit(out,'structure','props.$container',
          [...value.slice(0,props.start+1),'__fields__',...value.slice(props.end)]);
        for(const key of sorted(props.fields.keys()))
          walkSchema(out,'props.'+key,props.fields.get(key));
      }
    } else if(name==='events' || name==='slots' || name==='states') {
      const category=name==='events'?'event':name==='states'?'state':'structure';
      const members=literalList(value);
      if(!members) emit(out,category,name+'.$definition',value);
      else {
        const counts=new Map();
        for(const item of members) counts.set(item,(counts.get(item)??0)+1);
        for(const member of sorted(counts.keys()))
          emit(out,category,name+'.'+member,[String(counts.get(member))]);
      }
    } else {
      emit(out,name==='description'?'metadata':'structure',name,value);
    }
  }
  return out;
}

/**
 * Granular, audit-oriented changes. Absence of a parseable shape becomes an
 * explicit opaque structural change, and never a compatibility assurance.
 */
export function detectContractChanges(before,after) {
  const prior=flatten(before),next=flatten(after);
  const details=[];
  for (const key of sorted(new Set([...prior.keys(),...next.keys()]))) {
    const old=prior.get(key),current=next.get(key);
    if(old?.signature===current?.signature) continue;
    const entry=current??old;
    details.push({
      category:entry.category,
      path:entry.path,
      kind:!old?'added':!current?'removed':'modified',
      ...(old?{before:brief(old.signature)}:{}),
      ...(current?{after:brief(current.signature)}:{}),
    });
  }
  // If only member ordering or another unparsed token changed, expose it.
  if(details.length===0 && typeof before==='string' && typeof after==='string' &&
     signature(normalizedTokens(before))!==signature(normalizedTokens(after))) {
    details.push({category:'structure',path:'$ordering-or-opaque',kind:'modified',
      before:brief(signature(normalizedTokens(before))),
      after:brief(signature(normalizedTokens(after)))});
  }
  return details;
}
