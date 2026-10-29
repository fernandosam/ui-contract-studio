/** Shared documentary comparison for the catalog and Pi advisory selector. */
const byId = items => new Map(items.filter(item => item.id.trim()).map(item => [item.id, item]));
const byName = (a, b) => a.id.localeCompare(b.id, 'pt-BR');

/** Equal IDs are documentary overlaps, never equivalent APIs or admission. */
export function compareSemanticCapabilitySets(left, right) {
  if (left.name === right.name) throw new Error('Selecione componentes diferentes para comparar.');
  const leftIds = byId(left.capabilities);
  const rightIds = byId(right.capabilities);
  return {
    shared: [...leftIds.entries()]
      .filter(([id]) => rightIds.has(id))
      .map(([id, capability]) => ({id, left: capability, right: rightIds.get(id)}))
      .sort(byName),
    onlyLeft: [...leftIds.values()].filter(item => !rightIds.has(item.id)).sort(byName),
    onlyRight: [...rightIds.values()].filter(item => !leftIds.has(item.id)).sort(byName),
  };
}
