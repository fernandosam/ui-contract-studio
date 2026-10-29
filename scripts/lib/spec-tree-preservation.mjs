/**
 * E08 mutation-footprint audit. An accepted patch may change only its declared
 * node props, declared edge lists, and explicitly added/removed node IDs.
 * No contract, permission, state or element-reference inference happens here.
 * Returns a diagnostic without exposing prop/state values.
 */
const own = (value, key) => Object.hasOwn(value, key);
const keysEqual = (left, right) =>
  left.length === right.length && left.every(key => right.includes(key));

function equalJson(left, right) {
  if (left === right) return true;
  if (Array.isArray(left) || Array.isArray(right)) {
    return Array.isArray(left) && Array.isArray(right) &&
      left.length === right.length && left.every((item, index) => equalJson(item, right[index]));
  }
  if (!left || !right || typeof left !== 'object' || typeof right !== 'object') return false;
  const keys = Object.keys(left);
  return keysEqual(keys, Object.keys(right)) &&
    keys.every(key => equalJson(left[key], right[key]));
}

function findOrigin(spec, nodeId) {
  for (const [parentId, node] of Object.entries(spec.elements)) {
    const index = node.children.indexOf(nodeId);
    if (index !== -1) return { parentId, slot: null, index };
    for (const [slot, children] of Object.entries(node.slots ?? {})) {
      const slotIndex = children.indexOf(nodeId);
      if (slotIndex !== -1) return { parentId, slot, index: slotIndex };
    }
  }
  return null;
}

function subtree(spec, nodeId, ids = new Set()) {
  if (ids.has(nodeId)) return ids;
  ids.add(nodeId);
  const node = spec.elements[nodeId];
  for (const child of [...node.children, ...Object.values(node.slots ?? {}).flat()]) {
    subtree(spec, child, ids);
  }
  return ids;
}

function exceptKeys(object, ignored) {
  return Object.fromEntries(Object.entries(object).filter(([key]) => !ignored.has(key)));
}

/**
 * Check identity, sibling order, unaffected slots, node content and top-level state.
 * Both specs have already passed the channel-specific Zod and graph checks.
 * @returns {string | null} a value-free failure reason, or null on success.
 */
export function preservationViolation(before, after, operation, change) {
  if (!keysEqual(Object.keys(before), Object.keys(after)) ||
    Object.keys(before).some(key => key !== 'elements' && !equalJson(before[key], after[key])))
    return 'Campos globais, raiz ou estado foram alterados fora do patch.';

  const previousIds = Object.keys(before.elements);
  const expectedIds = new Set(previousIds);
  if (change.op === 'add') expectedIds.add(change.nodeId);
  if (change.op === 'remove') {
    const expectedRemoved = [...subtree(before, change.nodeId)];
    if (!keysEqual(expectedRemoved, change.removedIds))
      return 'Remoção tentou atingir IDs fora da subárvore selecionada.';
    for (const id of expectedRemoved) expectedIds.delete(id);
  }
  if (!keysEqual([...expectedIds], Object.keys(after.elements)))
    return 'IDs de elementos foram alterados fora do escopo autorizado.';

  // Replay only the permitted edge modifications against the previous tree.
  // This also protects ordering and references in the affected parents' OTHER slots.
  const expectedLists = new Map();
  const listKey = (parentId, slot) => parentId + '\u0000' + (slot ?? '');
  function listFor(parentId, slot) {
    const key = listKey(parentId, slot);
    if (!expectedLists.has(key)) {
      const parent = before.elements[parentId];
      const list = slot === null ? parent?.children : parent?.slots?.[slot];
      if (!Array.isArray(list)) return null;
      expectedLists.set(key, [...list]);
    }
    return expectedLists.get(key);
  }

  if (change.op === 'add') {
    const list = listFor(change.parentId, change.slot);
    if (!list) return 'Lista de destino inexistente.';
    list.splice(change.index, 0, change.nodeId);
  } else if (change.op === 'remove') {
    const from = findOrigin(before, change.nodeId);
    if (!from) return 'Referência de origem inexistente.';
    listFor(from.parentId, from.slot).splice(from.index, 1);
  } else if (change.op === 'move') {
    const from = findOrigin(before, change.nodeId);
    if (!from || !equalJson(from, change.from))
      return 'Referência de origem do movimento foi alterada.';
    listFor(from.parentId, from.slot).splice(from.index, 1);
    const destination = listFor(change.to.parentId, change.to.slot);
    if (!destination) return 'Lista de destino inexistente.';
    destination.splice(change.to.index, 0, change.nodeId);
  }

  const changedProps = new Set(change.op === 'update'
    ? [...change.setKeys, ...change.unsetKeys] : []);
  for (const id of previousIds) {
    if (!own(after.elements, id)) continue; // explicit subtree deletion only
    const original = before.elements[id];
    const updated = after.elements[id];
    if (!keysEqual(Object.keys(original), Object.keys(updated)))
      return 'Estrutura de nó preexistente alterada: ' + id + '.';
    for (const key of Object.keys(original)) {
      if (key === 'props' && change.op === 'update' && id === change.nodeId) {
        if (!equalJson(exceptKeys(original.props, changedProps),
          exceptKeys(updated.props, changedProps)))
          return 'Propriedades não selecionadas foram alteradas: ' + id + '.';
        if (change.unsetKeys.some(prop => own(updated.props, prop)) ||
          change.setKeys.some(prop => !own(updated.props, prop) ||
            !equalJson(updated.props[prop], operation.setProps[prop])))
          return 'Propriedades atualizadas divergem da operação declarada.';
      } else if (key === 'children') {
        const expected = expectedLists.get(listKey(id, null)) ?? original.children;
        if (!equalJson(expected, updated.children))
          return 'Referências ou ordem de filhos não selecionados foram alteradas: ' + id + '.';
      } else if (key === 'slots') {
        if (!keysEqual(Object.keys(original.slots), Object.keys(updated.slots)))
          return 'Slots preexistentes foram alterados: ' + id + '.';
        for (const slot of Object.keys(original.slots)) {
          const expected = expectedLists.get(listKey(id, slot)) ?? original.slots[slot];
          if (!equalJson(expected, updated.slots[slot]))
            return 'Referências ou ordem de slots não selecionados foram alteradas: ' + id + '.';
        }
      } else if (!equalJson(original[key], updated[key])) {
        return 'Conteúdo não selecionado foi alterado: ' + id + '.'; 
      }
    }
  }

  if (change.op === 'add' && !equalJson(after.elements[change.nodeId], operation.node))
    return 'O novo nó diverge do conteúdo declarado.';
  return null;
}
