import { normalizedTokens } from './contract-lock.mjs';

const levels = {none:0, patch:1, minor:2, major:3};
const versionPattern = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
const validStability = new Set(['experimental','beta','stable','deprecated']);

export function semverParts(version) {
  if (typeof version !== 'string' || !versionPattern.test(version)) return null;
  const parts = version.split('.').map(Number);
  return parts.every(Number.isSafeInteger) ? parts : null;
}
export function versionBump(before, after) {
  const a=semverParts(before), b=semverParts(after);
  if (!a || !b) return 'invalid';
  if (b[0]!==a[0]) return b[0]>a[0]?'major':'regression';
  if (b[1]!==a[1]) return b[1]>a[1]?'minor':'regression';
  if (b[2]!==a[2]) return b[2]>a[2]?'patch':'regression';
  return 'none';
}

const same=(a,b)=>a.length===b.length && a.every((v,i)=>v===b[i]);
const identifier=token=>/^[A-Za-z_$][A-Za-z\d_$]*$/.test(token??'');

// Description is part of today's fingerprint but is not a validation rule.
// Only mask the literal at the TOP-LEVEL of the component entry, not nested props.
function maskTopLevelDescription(tokens) {
  const result=[...tokens];let depth=0;
  for(let i=0;i<result.length;i++){
    if(result[i]==='{')depth++;
    else if(result[i]==='}')depth--;
    if(depth===1 && result[i]==='description' && result[i+1]===':' &&
       /^["']/.test(result[i+2]??''))result[i+2]='__description__';
  }
  return result;
}

function topLevelProps(tokens) {
  let depth=0;
  for(let i=0;i<tokens.length-5;i++){
    if(tokens[i]==='{')depth++;
    else if(tokens[i]==='}')depth--;
    if(depth!==1 || tokens[i]!=='props' || tokens[i+1]!==':')continue;
    if(!['obj','strict'].includes(tokens[i+2]) || tokens[i+3]!=='(' || tokens[i+4]!=='{')return null;
    const start=i+4, stack=[], fields=new Map();
    let fieldStart=start+1;
    for(let j=start+1;j<tokens.length;j++){
      const token=tokens[j];
      if(!stack.length && (token===',' || token==='}')){
        const field=tokens.slice(fieldStart,j);
        if(field.length){
          if(!identifier(field[0]) || field[1]!==':' || fields.has(field[0]))return null;
          fields.set(field[0],field.slice(2));
        }
        fieldStart=j+1;
        if(token==='}')return {start,end:j,fields};
      }else if('([{'.includes(token))stack.push(token);
      else if(')]}'.includes(token)){
        if(stack.pop()!=={')':'(',']':'[','}':'{'}[token])return null;
      }
    }
    return null;
  }
  return null;
}
const optionalField=tokens=>same(tokens.slice(-4),['.','optional','(',')']);

/** Prove only safe recognizable changes. Unknown source changes fail closed as MAJOR. */
export function classifySegmentChange(before,after) {
  if(typeof before!=='string' || typeof after!=='string')
    return {level:'major',reason:'Fonte anterior ou atual ausente; impacto não comprovável'};
  const oldTokens=normalizedTokens(before),newTokens=normalizedTokens(after);
  if(same(oldTokens,newTokens))return {level:'none',reason:'Sem alteração semântica no segmento'};
  const oldMasked=maskTopLevelDescription(oldTokens),newMasked=maskTopLevelDescription(newTokens);
  if(same(oldMasked,newMasked))return {level:'patch',reason:'Somente texto de descrição alterado'};
  const oldProps=topLevelProps(oldMasked),newProps=topLevelProps(newMasked);
  if(oldProps && newProps &&
      same([...oldMasked.slice(0,oldProps.start),...oldMasked.slice(oldProps.end+1)],
           [...newMasked.slice(0,newProps.start),...newMasked.slice(newProps.end+1)]) &&
      [...oldProps.fields].every(([key,value])=>same(value,newProps.fields.get(key)??[]))){
    const added=[...newProps.fields].filter(([key])=>!oldProps.fields.has(key));
    if(added.length && added.every(([,value])=>optionalField(value)))
      return {level:'minor',reason:'Apenas props opcionais adicionadas: '+added.map(([key])=>key).join(', ')};
  }
  return {level:'major',reason:'Alteração de schema, slot, evento ou semântica não comprovada como aditiva'};
}

export function classifyContractChanges(beforeLock,afterLock,beforeSegments,afterSegments) {
  const errors=[],changes=[],oldMap=new Map(),newMap=new Map();
  for(const [label,lock,map] of [['base',beforeLock,oldMap],['atual',afterLock,newMap]]){
    if(!Array.isArray(lock?.components)){errors.push('Lock '+label+' inválido');continue;}
    for(const item of lock.components){
      if(!item || typeof item.name!=='string' || !item.name || map.has(item.name)){
        errors.push('Lock '+label+': nome duplicado ou inválido: '+item?.name);continue;
      }
      map.set(item.name,item);
    }
  }
  for(const [name,now] of newMap){
    const prior=oldMap.get(name);
    if(!semverParts(now.version) || !validStability.has(now.stability) ||
       !/^[a-f0-9]{64}$/.test(now.semanticFingerprint??'') ||
       (now.stability==='stable' && now.status!=='approved')){
      errors.push(name+': metadados de versão, estabilidade, aprovação ou fingerprint inválidos');
      continue;
    }
    if(!prior){
      if(now.tier!=='extension')errors.push(name+': novo contrato base proibido');
      changes.push({name,level:'new',reason:'Novo contrato de extensão requer revisão e admissão',version:now.version});
      continue;
    }
    if(now.tier!==prior.tier)errors.push(name+': migração de tier proibida');
    const sourceDiff=classifySegmentChange(beforeSegments.get(name),afterSegments.get(name));
    let level=sourceDiff.level,reason=sourceDiff.reason;
    const fingerprintChanged=now.semanticFingerprint!==prior.semanticFingerprint;
    if(fingerprintChanged && level==='none')errors.push(name+': fingerprint alterado sem diferença de fonte contratual');
    if(!fingerprintChanged && level!=='none')errors.push(name+': fonte contratual mudou sem atualização do fingerprint');
    if(prior.stability==='stable' && now.stability!=='stable'){
      level='major';reason+='; retirada do canal estável Pi';
    }else if(prior.stability!=='stable' && now.stability==='stable' && levels[level]<levels.minor){
      level='minor';reason+='; exposição nova no canal estável Pi';
    }
    if(prior.status==='approved' && now.status!=='approved'){
      level='major';reason+='; aprovação revogada';
    }
    const bump=versionBump(prior.version,now.version);
    if(bump==='invalid'||bump==='regression'||levels[bump]<levels[level]){
      errors.push(name+': mudança '+level+' exige incremento '+level.toUpperCase()+
        ' (atual '+prior.version+' -> '+now.version+', '+bump+'): '+reason);
    }else if(level==='none' && bump!=='none'){
      errors.push(name+': versão alterada sem mudança pública justificável ('+prior.version+' -> '+now.version+')');
    }
    if(level!=='none'||bump!=='none')changes.push({name,level,reason,previous:prior.version,version:now.version,bump});
  }
  for(const name of oldMap.keys())if(!newMap.has(name))
    errors.push(name+': remoção exige processo explícito de migração; exclusão direta proibida');
  return {errors,changes};
}
