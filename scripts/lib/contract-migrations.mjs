import {graphErrors} from './spec-invariants.mjs';

// A deliberately closed, data-only migration grammar. There is no eval, plugin
// execution, implicit coercion, or fallback to the newest compatible version.
const semver=/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
const digest=/^[a-f0-9]{64}$/;
const own=(value,key)=>Object.prototype.hasOwnProperty.call(value,key);
const record=value=>value!==null && typeof value==='object' && !Array.isArray(value);
const fail=message=>{throw new Error('Contract migration: '+message);};
const sorted=items=>[...items].sort((a,b)=>a.localeCompare(b,'en'));
const copy=value=>structuredClone(value);
const pair=entry=>entry.version+'#'+entry.fingerprint;
const edgeKey=step=>step.type+'@'+step.from;
const validVersion=value=>typeof value==='string' && semver.test(value) && value.split('.').every(x=>Number.isSafeInteger(Number(x)));
const versionGreater=(a,b)=>{
  const left=a.split('.').map(Number),right=b.split('.').map(Number);
  for(let i=0;i<3;i++){if(right[i]!==left[i])return right[i]>left[i];}
  return false;
};
function knownContracts(lock){
  if(!record(lock) || !Array.isArray(lock.components))fail('reviewed lock missing');
  const result=new Map();
  for(const item of lock.components){
    if(!record(item) || typeof item.name!=='string' || result.has(item.name) ||
       !validVersion(item.version) || !digest.test(item.semanticFingerprint??''))
      fail('invalid or duplicate reviewed contract');
    result.set(item.name,item);
  }
  return result;
}
function assertStable(name,lockMap){
  const item=lockMap.get(name);
  if(!item || item.status!=='approved' || item.stability!=='stable')
    fail(name+': no approved stable target');
  return item;
}
function validateSpec(spec,known){
  if(!record(spec))fail('spec must be an object');
  const errors=graphErrors(spec,[...known.keys()]);
  if(errors.length)fail('invalid spec: '+errors.join('; '));
}
function validateOperations(operations,label){
  if(!Array.isArray(operations))fail(label+': operations must be an array');
  for(const op of operations){
    if(!record(op) || !['rename-prop','rename-event','set-default-prop'].includes(op.op))
      fail(label+': unsupported operation');
    const expected=op.op==='set-default-prop'?['op','key','value']:['op','from','to'];
    if(sorted(Object.keys(op)).join('|')!==sorted(expected).join('|'))
      fail(label+': operation contains extra or missing fields');
    for(const field of op.op==='set-default-prop'?['key']:['from','to']){
      if(typeof op[field]!=='string' || !/^[a-zA-Z][a-zA-Z0-9]*$/.test(op[field]) ||
         ['__proto__','constructor','prototype'].includes(op[field]))
        fail(label+': unsafe property/event name');
    }
    if(op.op!=='set-default-prop' && op.from===op.to)
      fail(label+': rename source and target are identical');
    if(op.op==='set-default-prop'){
      // JSON-safe only, no undefined, functions, NaN, or prototype-sensitive objects.
      let encoded;
      try{encoded=JSON.stringify(op.value);}catch{}
      if(encoded===undefined || encoded.length>8192 || JSON.parse(encoded)===undefined)
        fail(label+': invalid default value');
      if(!record(op.value) && !Array.isArray(op.value) &&
         !['string','boolean','number'].includes(typeof op.value) && op.value!==null)
        fail(label+': unsupported default value');
    }
  }
}
export function checkMigrationRegistry(registry,lock){
  const known=knownContracts(lock);
  if(!record(registry) || registry.schemaVersion!==1 ||
     !Array.isArray(registry.migrations) ||
     sorted(Object.keys(registry)).join('|')!=='migrations|schemaVersion')
    fail('registry schemaVersion must be 1');
  const edges=new Map();
  for(const step of registry.migrations){
    if(!record(step) || sorted(Object.keys(step)).join('|')!==
       'from|note|operations|sourceFingerprint|targetFingerprint|to|type' ||
       typeof step.type!=='string' || typeof step.note!=='string' || !step.note.trim() ||
       !validVersion(step.from) || !validVersion(step.to) ||
       !versionGreater(step.from,step.to) ||
       !digest.test(step.sourceFingerprint??'') || !digest.test(step.targetFingerprint??'') ||
       step.sourceFingerprint===step.targetFingerprint)
      fail('malformed migration edge');
    assertStable(step.type,known);
    validateOperations(step.operations,edgeKey(step));
    const key=edgeKey(step);
    if(edges.has(key))fail('duplicate migration origin: '+key);
    edges.set(key,step);
  }
  // Each registered legacy release must lead unambiguously to the reviewed lock.
  for(const first of edges.values()){
    const visited=new Set();
    let step=first;
    for(;;){
      const key=edgeKey(step);
      if(visited.has(key))fail('cycle at '+key);
      visited.add(key);
      const next=edges.get(step.type+'@'+step.to);
      if(!next){
        const target=known.get(step.type);
        if(target.version!==step.to || target.semanticFingerprint!==step.targetFingerprint)
          fail(key+': final target differs from reviewed lock');
        break;
      }
      if(step.targetFingerprint!==next.sourceFingerprint)
        fail(key+': fingerprint discontinuity');
      step=next;
    }
  }
  return edges;
}
function transform(node,step,nodeId,applied){
  for(const op of step.operations){
    const field=op.op==='rename-event'?'on':'props';
    const container=node[field];
    if(!record(container))fail(nodeId+': expected '+field+' object');
    if(op.op==='set-default-prop'){
      if(!own(container,op.key)){
        container[op.key]=copy(op.value);
        applied.push({nodeId,operation:op.op,path:field+'.'+op.key});
      }
    }else if(own(container,op.from)){
      if(own(container,op.to))
        fail(nodeId+': migration collision '+field+'.'+op.from+' -> '+op.to);
      container[op.to]=container[op.from];
      delete container[op.from];
      applied.push({nodeId,operation:op.op,path:field+'.'+op.from,to:field+'.'+op.to});
    }
  }
}
export function snapshotContractVersions(spec,lock){
  const known=knownContracts(lock);
  validateSpec(spec,known);
  const types=sorted(new Set(Object.values(spec.elements).map(node=>node.type)));
  const contracts={};
  for(const type of types){
    const c=assertStable(type,known);
    contracts[type]={version:c.version,fingerprint:c.semanticFingerprint};
  }
  return {schemaVersion:1,contracts};
}
export function migrateContractSpec({spec,versions,registry,lock}){
  const edges=checkMigrationRegistry(registry,lock);
  const known=knownContracts(lock);
  validateSpec(spec,known);
  if(!record(versions) || versions.schemaVersion!==1 || !record(versions.contracts) ||
     sorted(Object.keys(versions)).join('|')!=='contracts|schemaVersion')
    fail('versions manifest schemaVersion must be 1');
  const types=sorted(new Set(Object.values(spec.elements).map(node=>node.type)));
  if(sorted(Object.keys(versions.contracts)).join('|')!==types.join('|'))
    fail('versions manifest must list exactly the types used by this spec');
  const migrated=copy(spec),contracts={},steps=[],operations=[];
  for(const type of types){
    const target=assertStable(type,known);
    const origin=versions.contracts[type];
    if(!record(origin) || sorted(Object.keys(origin)).join('|')!=='fingerprint|version' ||
       !validVersion(origin.version) || !digest.test(origin.fingerprint??''))
      fail(type+': invalid version/fingerprint manifest');
    let current={...origin};
    const visited=new Set();
    while(pair(current)!==target.version+'#'+target.semanticFingerprint){
      const key=type+'@'+current.version;
      if(visited.has(key))fail(type+': migration cycle');
      visited.add(key);
      const step=edges.get(key);
      if(!step || step.sourceFingerprint!==current.fingerprint)
        fail(type+': unsupported source release '+current.version+' ('+current.fingerprint.slice(0,12)+')');
      for(const nodeId of sorted(Object.keys(migrated.elements))){
        if(migrated.elements[nodeId].type===type)
          transform(migrated.elements[nodeId],step,nodeId,operations);
      }
      steps.push({type,from:step.from,to:step.to,sourceFingerprint:step.sourceFingerprint,
        targetFingerprint:step.targetFingerprint,note:step.note});
      current={version:step.to,fingerprint:step.targetFingerprint};
    }
    contracts[type]={version:target.version,fingerprint:target.semanticFingerprint};
  }
  validateSpec(migrated,known);
  return {spec:migrated,versions:{schemaVersion:1,contracts},
    report:{schemaVersion:1,valid:true,steps,operations,changedTypes:sorted(new Set(steps.map(s=>s.type)))}};
}
