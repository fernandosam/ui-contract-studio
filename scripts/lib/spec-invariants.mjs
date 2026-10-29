/** Structural policy in plain JS: works offline without node_modules. */
export function graphErrors(spec, allowedTypes, { maxElements=300, maxDepth=30, allowedActions=["setState","pushState","removeState","buttonClick","formSubmit","linkClick"], allowedEvents={} }={}) {
  const errors=[]; const known=new Set(allowedTypes); const actions=new Set(allowedActions);
  const safeStatePath=value=>typeof value==="string"&&value.length>0&&value.length<=200&&
    !Array.from(value).some(char=>char.charCodeAt(0)<32)&&
    !value.replaceAll("[",".").replaceAll("]",".").replaceAll('"',".").replaceAll("'",".").split(".")
      .some(segment=>["__proto__","prototype","constructor"].includes(segment));
  if(!spec||typeof spec!=="object"||Array.isArray(spec)) return ["Spec deve ser um objeto."];
  for(const key of Object.keys(spec)) if(!["root","elements","state"].includes(key)) errors.push(`Campo global não autorizado: ${key}.`);
  if(typeof spec.root!=="string"||!spec.root) errors.push("root deve ser uma string não vazia.");
  if(!spec.elements||typeof spec.elements!=="object"||Array.isArray(spec.elements)) return [...errors,"elements deve ser um mapa."];
  if(spec.state!==undefined && (typeof spec.state!=="object"||spec.state===null||Array.isArray(spec.state))) errors.push("state deve ser objeto.");
  const entries=Object.entries(spec.elements); if(entries.length>maxElements)errors.push(`Spec excede ${maxElements} elementos.`);
  const ids=new Set(entries.map(([id])=>id)),parents=new Map();
  function inspectChildren(parent,children,field){
    if(!Array.isArray(children)){errors.push(`${parent}: ${field} deve ser array.`);return;}
    const seen=new Set();
    for(const child of children){
      if(typeof child!=="string"||!ids.has(child)){errors.push(`${parent}: filho inexistente (${String(child)}).`);continue;}
      if(seen.has(child))errors.push(`${parent}: filho duplicado (${child}).`);seen.add(child);
      parents.set(child,(parents.get(child)??0)+1);
    }
  }
  for(const [id,node] of entries){
    if(!node||typeof node!=="object"||Array.isArray(node)){errors.push(`${id}: elemento inválido.`);continue;}
    for(const key of Object.keys(node)) if(!["type","props","children","slots","on","visible","repeat"].includes(key)) errors.push(`${id}: propriedade estrutural não permitida: ${key}.`);
    if(!known.has(node.type))errors.push(`${id}: tipo não registrado (${String(node.type)}).`);
    if(!node.props||typeof node.props!=="object"||Array.isArray(node.props))errors.push(`${id}: props precisa ser objeto.`);
    // @json-render/core requires children on every element, including leaf/composite nodes.
    inspectChildren(id,node.children,"children");
    if(node.slots!==undefined){
      if(!node.slots||typeof node.slots!=="object"||Array.isArray(node.slots))errors.push(`${id}: slots inválidos.`);
      else for(const [name,slotChildren] of Object.entries(node.slots)){
        const allowed=allowedEvents[node.type]?.slots;
        if(allowed && !allowed.includes(name))errors.push(`${id}: slot não registrado (${name}).`);
        inspectChildren(id,slotChildren,`slots.${name}`);
      }
    }
    if(node.on!==undefined){
      if(!node.on||typeof node.on!=="object"||Array.isArray(node.on)) errors.push(`${id}: on inválido.`);
      else for(const [event,handlers] of Object.entries(node.on)){
        const allowed=allowedEvents[node.type]?.events;
        if(allowedEvents[node.type] && !(allowed??[]).includes(event))errors.push(`${id}: evento não registrado (${event}).`);
        for(const handler of Array.isArray(handlers)?handlers:[handlers]){
          if(!handler || typeof handler!=="object" || !actions.has(handler.action))errors.push(`${id}: ação não permitida (${String(handler?.action)}).`);
          if(handler && ["setState","pushState","removeState"].includes(handler.action)){
            if(!safeStatePath(handler.params?.statePath))errors.push(`${id}: statePath inválido ou inseguro.`);
            if(handler.params?.clearStatePath!==undefined&&!safeStatePath(handler.params.clearStatePath))
              errors.push(`${id}: clearStatePath inválido ou inseguro.`);
          }
        }
      }
    }
    if(node.repeat!==undefined && (!node.repeat||typeof node.repeat!=="object"||Array.isArray(node.repeat)))errors.push(`${id}: repeat inválido.`);
  }
  if(!ids.has(spec.root)){errors.push(`root inexistente: ${String(spec.root)}.`);return errors;}
  if((parents.get(spec.root)??0)>0)errors.push("O elemento root não pode ser filho de outro.");
  for(const [id,count] of parents)if(count>1)errors.push(`${id}: mais de um pai (não é uma árvore).`);
  const visited=new Set(),stack=new Set();
  function walk(id,depth){
    if(depth>maxDepth){errors.push(`${id}: profundidade máxima ${maxDepth} excedida.`);return;}
    if(stack.has(id)){errors.push(`${id}: ciclo na árvore.`);return;}
    if(visited.has(id))return;
    visited.add(id);stack.add(id);
    const node=spec.elements[id];
    const children=[...(Array.isArray(node?.children)?node.children:[]),...Object.values(node?.slots??{}).flat()];
    for(const c of children)if(ids.has(c))walk(c,depth+1);
    stack.delete(id);
  }
  walk(spec.root,0);
  for(const id of ids)if(!visited.has(id))errors.push(`${id}: elemento órfão/desconectado.`);
  return errors;
}
