/**
 * E08 edit session: preview/commit/history around the existing validated tree-patch engine.
 * All snapshots are private, local and bounded. Nothing executes or persists a spec.
 */
const copy = value => structuredClone(value);
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const fail = (code, message) => ({ ok: false, error: { code, message } });

function positions(spec) {
  const result = new Map();
  for (const [parentId, node] of Object.entries(spec.elements)) {
    node.children.forEach((nodeId, index) => result.set(nodeId, { parentId, slot: null, index }));
    for (const [slot, list] of Object.entries(node.slots ?? {})) {
      list.forEach((nodeId, index) => result.set(nodeId, { parentId, slot, index }));
    }
  }
  return result;
}

/** A net, value-free diff, not a JSON dump or an executable inverse patch. */
export function diffTreeSpecs(before, after, changes = []) {
  const left = before.elements, right = after.elements;
  const leftIds = new Set(Object.keys(left)), rightIds = new Set(Object.keys(right));
  const added = [...rightIds].filter(id => !leftIds.has(id)).sort();
  const removed = [...leftIds].filter(id => !rightIds.has(id)).sort();
  const beforePositions = positions(before), afterPositions = positions(after);
  const explicitMoves = new Set(changes.filter(change => change.op === 'move').map(change => change.nodeId));
  const moved = [];
  const properties = [];
  for (const nodeId of [...leftIds].filter(id => rightIds.has(id)).sort()) {
    const from = beforePositions.get(nodeId), to = afterPositions.get(nodeId);
    if (from && to && (from.parentId !== to.parentId || from.slot !== to.slot ||
      (explicitMoves.has(nodeId) && from.index !== to.index))) {
      moved.push({ nodeId, from: copy(from), to: copy(to) });
    }
    const oldProps = left[nodeId].props, newProps = right[nodeId].props;
    const oldKeys = new Set(Object.keys(oldProps)), newKeys = new Set(Object.keys(newProps));
    const addedKeys = [...newKeys].filter(key => !oldKeys.has(key)).sort();
    const removedKeys = [...oldKeys].filter(key => !newKeys.has(key)).sort();
    const changedKeys = [...oldKeys].filter(key => newKeys.has(key) &&
      !same(oldProps[key], newProps[key])).sort();
    if (addedKeys.length || removedKeys.length || changedKeys.length) {
      properties.push({ nodeId, addedKeys, removedKeys, changedKeys });
    }
  }
  return { added, removed, moved, properties };
}

/**
 * applyPatch is a TRUSTED, channel-bound callback such as applyPiTreePatch.
 * Consumers cannot supply a channel through the patch.
 */
export function createTreeEditSession(original, applyPatch, { maxEntries = 50 } = {}) {
  if (typeof applyPatch !== 'function') throw new TypeError('O validador do canal é obrigatório.');
  if (!Number.isSafeInteger(maxEntries) || maxEntries < 1 || maxEntries > 100)
    throw new RangeError('maxEntries deve estar entre 1 e 100.');
  let base = copy(original), current = copy(original);
  let entries = [], cursor = 0, revision = 0, pending = null, sequence = 0;

  function read() {
    return {
      spec: copy(current), revision, cursor, canUndo: cursor > 0,
      canRedo: cursor < entries.length,
      history: entries.map((entry, index) => ({
        id: entry.id, applied: index < cursor, changes: copy(entry.changes), diff: copy(entry.diff),
      })),
    };
  }

  function preview(patch) {
    pending = null;
    let result;
    try { result = applyPatch(copy(current), copy(patch)); }
    catch { return fail('preview_failed', 'Não foi possível validar a prévia.'); }
    if (!result?.ok) return { ok: false, error: copy(result?.error ?? {
      code: 'preview_failed', message: 'Patch rejeitado pelo motor de edição.',
    }) };
    if (same(current, result.spec)) return fail('no_changes', 'O patch não produz diferenças.');
    const diff = diffTreeSpecs(current, result.spec, result.changes);
    pending = { revision, patch: copy(patch), next: copy(result.spec), changes: copy(result.changes), diff };
    return { ok: true, revision, spec: copy(result.spec),
      changes: copy(result.changes), diff: copy(diff) };
  }

  function commit() {
    if (!pending || pending.revision !== revision)
      return fail('stale_preview', 'Gere uma nova prévia antes de aplicar.');
    const staged = pending;
    pending = null;
    let checked;
    try { checked = applyPatch(copy(current), copy(staged.patch)); }
    catch { return fail('commit_failed', 'Revalidação da alteração falhou.'); }
    if (!checked?.ok || !same(checked.spec, staged.next))
      return fail('stale_preview', 'A prévia não corresponde mais ao resultado validado.');
    entries = entries.slice(0, cursor);
    entries.push({ id: ++sequence, patch: copy(staged.patch), after: copy(checked.spec),
      changes: copy(staged.changes), diff: copy(staged.diff) });
    cursor = entries.length;
    current = copy(checked.spec);
    if (entries.length > maxEntries) {
      base = copy(entries.shift().after);
      cursor -= 1;
    }
    revision += 1;
    return { ok: true, ...read() };
  }

  // Replay through the same Zod + graph validator; never trust a stored inverse
  // operation or restore an externally mutable snapshot blindly.
  function restore(target) {
    if (target < 0 || target > entries.length) return fail('history_boundary', 'Limite do histórico.');
    let candidate = copy(base);
    for (let i = 0; i < target; i++) {
      let replay;
      try { replay = applyPatch(copy(candidate), copy(entries[i].patch)); }
      catch { return fail('history_invalid', 'Não foi possível revalidar esta revisão.'); }
      if (!replay?.ok || !same(replay.spec, entries[i].after))
        return fail('history_invalid', 'Revisão divergente ou não autorizada.');
      candidate = copy(replay.spec);
    }
    current = candidate;
    cursor = target;
    revision += 1;
    pending = null;
    return { ok: true, ...read() };
  }

  return Object.freeze({
    read, preview, commit,
    undo: () => cursor === 0 ? fail('history_boundary', 'Nada para desfazer.') : restore(cursor - 1),
    redo: () => cursor === entries.length ? fail('history_boundary', 'Nada para refazer.') : restore(cursor + 1),
  });
}
