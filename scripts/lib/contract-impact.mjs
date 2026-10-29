import {existsSync, readFileSync, readdirSync} from 'node:fs';
import {resolve, relative, dirname, join, sep} from 'node:path';

// Read-only consumer analysis. Only typed JSON nodes, declared compositions and
// reviewed Pi projections count as evidence; arbitrary string matches do not.
const order = (a,b) => a.localeCompare(b,'en');
const unique = values => [...new Set(values)].sort(order);
const readJson = file => JSON.parse(readFileSync(file,'utf8'));
const kebab = name => name.replace(/([a-z0-9])([A-Z])/g,'$1-$2').toLowerCase();
const pascal = name => name.split('-').map(x => x[0]?.toUpperCase()+x.slice(1)).join('');
const severity = level => ['major','removed','new'].includes(level) ? 'high'
  : level==='minor' ? 'medium' : 'low';

function filesIn(root, directory, errors) {
  const absolute = resolve(root,directory);
  if (!existsSync(absolute)) {
    errors.push('Missing consumer directory: '+directory);
    return [];
  }
  return readdirSync(absolute,{withFileTypes:true})
    .filter(entry => entry.isFile() && entry.name.endsWith('.json'))
    .map(entry => directory+'/'+entry.name).sort(order);
}

function specNodes(spec, file, errors) {
  if (!spec || typeof spec!=='object' || Array.isArray(spec) ||
      !spec.elements || typeof spec.elements!=='object' || Array.isArray(spec.elements)) {
    errors.push('Invalid JSON UI spec: '+file);
    return [];
  }
  const nodes=[];
  for (const [id,node] of Object.entries(spec.elements)) {
    if (!node || typeof node.type!=='string' || !node.type) {
      errors.push('Invalid typed node: '+file+'#'+id);
      continue;
    }
    nodes.push({file,nodeId:id,type:node.type,
      props:node.props && typeof node.props==='object' ? node.props : {},
      on:node.on && typeof node.on==='object' ? node.on : {}});
  }
  return nodes.sort((a,b)=>order(a.nodeId,b.nodeId));
}

function dependencies(root, manifest, errors) {
  const graph=new Map(), sources=new Map();
  for (const item of manifest.components) {
    const path='src/ui-catalog/extensions/composites/templates/'+item.template;
    sources.set(item.name,path);
    if (!existsSync(resolve(root,path))) {
      errors.push('Missing composition template: '+path);
      continue;
    }
    const nodes=specNodes(readJson(resolve(root,path)),path,errors);
    graph.set(item.name,unique(nodes.map(n=>n.type)));
  }
  const policyPath=resolve(root,'src/ui-catalog/composition-policy.json');
  if (!existsSync(policyPath)) {errors.push('Missing composition policy');return {graph,sources};}
  const policy=readJson(policyPath);
  for (const name of unique([...(policy.primitiveExtensions??[]),...(policy.reactComposites??[])])) {
    const path='src/ui-catalog/extensions/components/'+kebab(name)+'.tsx';
    sources.set(name,path);
    if (!existsSync(resolve(root,path))) {
      errors.push('Missing React adapter: '+path);
      continue;
    }
    // Follow local imports only; never infer usage from comments or strings.
    const visited=new Set(), primitives=new Set();
    const visit=(filename)=>{
      const abs=resolve(root,filename);
      if (visited.has(abs)||!existsSync(abs)) return;
      visited.add(abs);
      const code=readFileSync(abs,'utf8');
      for (const match of code.matchAll(/\bfrom\s*['"]([^'"]+)['"]/g)) {
        const imp=match[1];
        let location;
        if (imp.startsWith('@/')) location=resolve(root,'src',imp.slice(2));
        else if (imp.startsWith('.')) location=resolve(dirname(abs),imp);
        else continue;
        const rel=relative(root,location).split(sep).join('/');
        if (rel.startsWith('../')||rel==='..') continue;
        if (rel.startsWith('src/components/ui/')) {
          const basename=rel.slice('src/components/ui/'.length).split('/')[0].replace(/\.[^.]+$/,'');
          primitives.add(pascal(basename));
        } else if (rel.startsWith('src/') && visited.size<100) {
          for (const ext of ['','.tsx','.ts','.mjs','.jsx','.js']) {
            if (existsSync(location+ext)) {visit(relative(root,location+ext));break;}
          }
        }
      }
    };
    visit(path);
    graph.set(name,unique(primitives));
  }
  return {graph,sources};
}

function dependencyChain(graph, source, target) {
  if (source===target) return [source];
  const queue=[[source]], seen=new Set([source]);
  while(queue.length) {
    const path=queue.shift();
    for(const next of graph.get(path.at(-1))??[]) {
      if (next===target) return [...path,next];
      if (!seen.has(next)) {seen.add(next);queue.push([...path,next]);}
    }
  }
  return null;
}

function hasPath(value, parts) {
  if (!parts.length) return true;
  if (Array.isArray(value)) return value.some(entry=>hasPath(entry,parts));
  if (!value || typeof value!=='object' || !Object.hasOwn(value,parts[0])) return false;
  return hasPath(value[parts[0]],parts.slice(1));
}

function matchedPaths(node, details) {
  return unique(details.filter(detail=>{
    if (typeof detail.path!=='string') return false;
    if (detail.path.startsWith('props.')) {
      const tokens=detail.path.slice(6).replaceAll('[]','').split('.');
      if (tokens.some(t=>t.startsWith('$'))) return false;
      return hasPath(node.props,tokens);
    }
    if (detail.path.startsWith('events.')) return Object.hasOwn(node.on,detail.path.slice(7));
    return false;
  }).map(detail=>detail.path));
}

function readArtifact(root,file,errors) {
  try {return specNodes(readJson(resolve(root,file)),file,errors);}
  catch(error) {errors.push('Cannot read '+file+': '+error.message);return [];}
}

export function analyzeContractImpact({changes,root=process.cwd(),baseCommit=null,valid=true,upstreamErrors=[]}) {
  if (!Array.isArray(changes)) throw new Error('Expected changes array from contract diff');
  const errors=[], categories=[
    ['screens','src/ui-screens'],
    ['examples','pi-catalog/examples'],
    ['examples','pi-catalog/experimental-examples'],
    ['compositions','src/ui-catalog/extensions/composites/templates'],
  ];
  const artifactFiles=categories.flatMap(([category,directory]) =>
    filesIn(root,directory,errors).map(file=>({category,file})));
  const nodes=artifactFiles.flatMap(({category,file}) =>
    readArtifact(root,file,errors).map(n=>({...n,category})));
  const manifestPath=resolve(root,'src/ui-catalog/extensions/composites/generated-manifest.json');
  const manifest=existsSync(manifestPath)?readJson(manifestPath):{components:[]};
  if (!existsSync(manifestPath)) errors.push('Missing generated composition manifest');
  const {graph,sources}=dependencies(root,manifest,errors);
  const lockPath=resolve(root,'src/ui-catalog/contracts.lock.json');
  const piPath=resolve(root,'pi-catalog/contracts.json');
  const schemaPath=resolve(root,'pi-catalog/props-json-schema.json');
  for (const path of [lockPath,piPath,schemaPath])
    if (!existsSync(path)) errors.push('Missing Pi integration artifact: '+relative(root,path));
  const lock=existsSync(lockPath)?readJson(lockPath):{components:[]};
  const pi=existsSync(piPath)?readJson(piPath):{components:[]};
  const schema=existsSync(schemaPath)?readJson(schemaPath):{types:{}};
  const reviewed=new Map((lock.components??[]).map(item=>[item.name,item]));
  const published=new Map((pi.components??[]).map(item=>[item.type,item]));
  const results=[];
  const diagnostics=[];
  for (const change of [...changes].sort((a,b)=>order(a.name,b.name))) {
    if (!change || typeof change.name!=='string' || !change.name) {
      errors.push('Invalid contract change record');
      continue;
    }
    const usages=[];
    for (const node of nodes) {
      const via=dependencyChain(graph,node.type,change.name);
      if (!via) continue;
      usages.push({category:node.category,file:node.file,nodeId:node.nodeId,
        reference:node.type,relationship:via.length===1?'direct':'transitive',
        via,matchedPaths:via.length===1?matchedPaths(node,change.details??[]):[]});
    }
    if (sources.has(change.name)) {
      // A changed composite is itself a consumer definition even if no other
      // JSON artifact instantiates it (not a claim of runtime execution).
      usages.push({category:'compositions',file:sources.get(change.name),
        nodeId:null,reference:change.name,relationship:'definition',
        via:[change.name],matchedPaths:[]});
    }
    usages.sort((a,b)=>order(a.category,b.category)||order(a.file,b.file)||
      order(a.nodeId??'',b.nodeId??'')||order(a.relationship,b.relationship));
    const source=reviewed.get(change.name), projected=published.get(change.name);
    const schemaPresent=Object.hasOwn(schema.types??{},change.name);
    let exposure='not-published';
    if (projected) {
      exposure=projected.lifecycle==='stable' && projected.stability==='stable'
        ? 'stable':'experimental';
      if (source && (projected.version!==source.version ||
          projected.fingerprint!==source.semanticFingerprint ||
          projected.stability!==source.stability)) {
        exposure='projection-divergent';
        diagnostics.push(change.name+': Pi projection differs from reviewed lock');
      }
    } else if (source) {
      diagnostics.push(change.name+': reviewed contract missing from Pi projection');
    }
    if (projected && !schemaPresent)
      diagnostics.push(change.name+': Pi JSON Schema type missing');
    results.push({name:change.name,level:change.level,priority:severity(change.level),
      previous:change.previous??null,version:change.version??null,
      reason:change.reason??'',details:change.details??[],
      consumers:usages,counts:{
        screens:unique(usages.filter(x=>x.category==='screens').map(x=>x.file)).length,
        examples:unique(usages.filter(x=>x.category==='examples').map(x=>x.file)).length,
        compositions:unique(usages.filter(x=>x.category==='compositions').map(x=>x.file)).length,
        references:usages.length,
      },
      pi:{exposure,contractPath:projected?'pi-catalog/contracts.json#'+change.name:null,
        schemaPath:schemaPresent?'pi-catalog/props-json-schema.json#types.'+change.name:null,
        reviewedStability:source?.stability??null,
        actionsUnchanged:true},
      reviewRequired:severity(change.level)==='high' || exposure==='projection-divergent',
    });
  }
  const totals={changes:results.length,
    screens:unique(results.flatMap(x=>x.consumers.filter(c=>c.category==='screens').map(c=>c.file))).length,
    examples:unique(results.flatMap(x=>x.consumers.filter(c=>c.category==='examples').map(c=>c.file))).length,
    compositions:unique(results.flatMap(x=>x.consumers.filter(c=>c.category==='compositions').map(c=>c.file))).length,
    piExposed:results.filter(x=>['stable','experimental'].includes(x.pi.exposure)).length,
    highPriority:results.filter(x=>x.priority==='high').length,
  };
  return {schemaVersion:1,baseCommit,valid:Boolean(valid)&&errors.length===0&&upstreamErrors.length===0,
    totals,contracts:results,diagnostics:unique(diagnostics),errors:unique([...upstreamErrors,...errors]),
    limitations:['Static declared references only; runtime/dynamic consumers are not proven absent.',
      'A matched JSON prop or event is evidence of explicit use, not proof of runtime breakage.',
      'Reporting does not approve contracts, change Pi permissions or add a new blocking gate.']};
}

const safeText = value => String(value??'').replace(/\|/g,'\\|').replace(/\r?\n/g,' ');
export function impactMarkdown(report) {
  const lines=['# E07 — Contract consumer impact','',
    'Base commit: '+(report.baseCommit??'not supplied'),
    'Classification valid: '+String(report.valid),
    'Changed contracts: '+report.totals.changes+
      '; JSON screens: '+report.totals.screens+
      '; examples: '+report.totals.examples+
      '; compositions: '+report.totals.compositions+
      '; Pi-exposed contracts: '+report.totals.piExposed,
    '',
    '| Contract | Level | Priority | Screens | Examples | Compositions | Pi channel |',
    '| --- | --- | --- | ---: | ---: | ---: | --- |'];
  for(const entry of report.contracts) {
    lines.push('| '+[entry.name,entry.level,entry.priority,entry.counts.screens,
      entry.counts.examples,entry.counts.compositions,entry.pi.exposure].map(safeText).join(' | ')+' |');
  }
  lines.push('','## Traceability','');
  for(const entry of report.contracts) {
    lines.push('### '+entry.name+' ('+entry.level+')','',
      safeText(entry.reason),'',
      'Pi projection: '+(entry.pi.contractPath??'not published')+
      '; schema: '+(entry.pi.schemaPath??'not exported'),
      'Review: '+(entry.reviewRequired?'required':'assess according to existing policies'),'');
    if (!entry.consumers.length) lines.push('No declared consumer found in the inspected sources (not proof of absence).','');
    for(const consumer of entry.consumers) {
      lines.push('- '+consumer.category+': '+consumer.file+
        (consumer.nodeId?'#'+consumer.nodeId:'')+
        ' ['+consumer.relationship+'] via '+consumer.via.join(' -> ')+
        (consumer.matchedPaths.length?' (explicit: '+consumer.matchedPaths.join(', ')+')':''));
    }
    if(entry.consumers.length) lines.push('');
  }
  if (report.diagnostics.length) lines.push('## Pi diagnostics','',...report.diagnostics.map(x=>'- '+safeText(x)),'');
  if (report.errors.length) lines.push('## Source/classification errors','',...report.errors.map(x=>'- '+safeText(x)),'');
  lines.push('## Limitations','',...report.limitations.map(x=>'- '+x),'');
  return lines.join('\n')+'\n';
}
