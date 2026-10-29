/**
 * E08 layout safety invariants independent of advisory visual scoring.
 *
 * These are structural guarantees that hold for every JSON screen. Named
 * semantic flows additionally use their existing layout contracts via the
 * trusted facade. Never infer permissions or component APIs from layout.
 */
const LEAF_TYPES = new Set(['Heading', 'Text']);

export function layoutStructureErrors(spec) {
  const issues = [];
  for (const [id, node] of Object.entries(spec.elements)) {
    if (!LEAF_TYPES.has(node.type)) continue;
    // These render text only: attaching children would silently hide the
    // added/moved subtree even though the base Zod spec can remain valid.
    if (node.children.length || Object.values(node.slots ?? {}).some(ids => ids.length))
      issues.push('layout-leaf-children:' + id);
    if (node.type === 'Heading' && !node.props.text.trim())
      issues.push('layout-empty-heading:' + id);
  }
  return issues;
}
