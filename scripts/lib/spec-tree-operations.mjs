import { graphErrors } from './spec-invariants.mjs';
import { preservationViolation } from './spec-tree-preservation.mjs';

/** E08/v1: pure, atomic edits to an admitted json-render tree. No side effects. */
const MAX_OPERATIONS = 50;
const ID = /^[A-Za-z][A-Za-z0-9_-]{0,79}$/;
const FORBIDDEN_KEYS = new Set(['__proto__', 'prototype', 'constructor']);
const FIELDS = {
  add: ['op', 'nodeId', 'node', 'parentId', 'slot', 'index'],
  remove: ['op', 'nodeId'],
  move: ['op', 'nodeId', 'parentId', 'slot', 'index'],
  update: ['op', 'nodeId', 'setProps', 'unsetProps'],
};

class PatchError extends Error {
  constructor(code, message) { super(message); this.code = code; }
}
const reject = (code, message) => { throw new PatchError(code, message); };
const record = value => value !== null && typeof value === 'object' && !Array.isArray(value) &&
  (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);
const own = (object, key) => Object.hasOwn(object, key);

function assertJson(value, seen = new WeakSet(), depth = 0) {
  if (depth > 100) reject('invalid_json', 'Profundidade JSON excedida.');
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return;
  if (typeof value === 'number' && Number.isFinite(value)) return;
  if (typeof value !== 'object' || (!Array.isArray(value) && !record(value)))
    reject('invalid_json', 'Somente dados JSON são aceitos.');
  if (seen.has(value)) reject('invalid_json', 'Referências circulares ou compartilhadas não são JSON.');
  seen.add(value);
  for (const [key, child] of Object.entries(value)) {
    if (FORBIDDEN_KEYS.has(key)) reject('invalid_json', 'Chave JSON reservada.');
    assertJson(child, seen, depth + 1);
  }
  seen.delete(value);
}
function strictFields(object, fields) {
  if (!record(object)) reject('invalid_operation', 'Operação deve ser um objeto.');
  for (const key of Object.keys(object)) if (!fields.includes(key))
    reject('invalid_operation', 'Campo de operação não reconhecido: ' + key + '.');
}
function id(value) {
  if (typeof value !== 'string' || !ID.test(value))
    reject('invalid_id', 'Identificador deve iniciar com letra e conter até 80 caracteres alfanuméricos, _ ou -.');
}
function location(operation) {
  id(operation.parentId);
  if (own(operation, 'slot') && (typeof operation.slot !== 'string' || !ID.test(operation.slot)))
    reject('invalid_slot', 'slot deve ser um identificador válido.');
  if (own(operation, 'index') && (!Number.isSafeInteger(operation.index) || operation.index < 0))
    reject('invalid_index', 'index deve ser um inteiro não negativo.');
}
function validateOperation(op) {
  if (!record(op)) reject('invalid_operation', 'Operação deve ser um objeto.');
  strictFields(op, FIELDS[op.op] ?? []);
  if (!own(FIELDS, op.op)) reject('invalid_operation', 'Operação desconhecida.');
  id(op.nodeId);
  if (op.op === 'add') {
    location(op);
    if (!record(op.node) || typeof op.node.type !== 'string' || !record(op.node.props) ||
      own(op.node, 'on') || !Array.isArray(op.node.children) || op.node.children.length ||
      (own(op.node, 'slots') && (!record(op.node.slots) || Object.values(op.node.slots).some(x => !Array.isArray(x) || x.length))))
      reject('invalid_node', 'Novo nó precisa ter type, props e children: []; slots vazios e sem handlers on.');
  } else if (op.op === 'move') {
    location(op);
  } else if (op.op === 'update') {
    if (own(op, 'setProps') && !record(op.setProps)) reject('invalid_update', 'setProps deve ser um objeto.');
    if (own(op, 'unsetProps') && (!Array.isArray(op.unsetProps) ||
      op.unsetProps.some(x => typeof x !== 'string' || !x || FORBIDDEN_KEYS.has(x)) ||
      new Set(op.unsetProps).size !== op.unsetProps.length))
      reject('invalid_update', 'unsetProps deve conter chaves únicas.');
    const set = Object.keys(op.setProps ?? {}), unset = op.unsetProps ?? [];
    if ((!set.length && !unset.length) || set.some(key => unset.includes(key)))
      reject('invalid_update', 'Atualização vazia ou com chaves conflitantes.');
  }
}
function validateTree(spec, policy) {
  assertJson(spec);
  let valid;
  try { valid = policy.validateSpec(spec)?.success === true; }
  catch { valid = false; }
  if (!valid) reject('schema_invalid', 'A árvore não atende ao catálogo Zod do canal selecionado.');
  // graphErrors predates E08 and skips slot allowlists on slot-less component types.
  // Enforce the absence of undeclared slots here without expanding component APIs.
  if (record(spec.elements)) for (const node of Object.values(spec.elements)) {
    if (!record(node) || !record(node.slots)) continue;
    for (const slot of Object.keys(node.slots)) {
      if (!policy.allowedEvents[node.type]?.slots?.includes(slot))
        reject('graph_invalid', 'Slot não declarado pelo contrato do componente.');
    }
  }
  const issues = graphErrors(spec, policy.allowedTypes, {
    allowedActions: policy.allowedActions, allowedEvents: policy.allowedEvents,
  });
  if (issues.length) reject('graph_invalid', 'Integridade da árvore rejeitada: ' + issues[0]);
}
function childrenOf(node) {
  return [...node.children, ...Object.values(node.slots ?? {}).flat()];
}
function descendants(elements, nodeId, found = new Set()) {
  if (found.has(nodeId)) return found;
  found.add(nodeId);
  for (const childId of childrenOf(elements[nodeId])) descendants(elements, childId, found);
  return found;
}
function findParent(spec, nodeId) {
  for (const [parentId, parent] of Object.entries(spec.elements)) {
    if (parent.children.includes(nodeId))
      return { parentId, slot: null, index: parent.children.indexOf(nodeId), list: parent.children };
    for (const [slot, list] of Object.entries(parent.slots ?? {})) if (list.includes(nodeId))
      return { parentId, slot, index: list.indexOf(nodeId), list };
  }
  reject('missing_parent', 'Não foi possível localizar o pai do nó.');
}
function target(spec, op) {
  if (!own(spec.elements, op.parentId)) reject('missing_parent', 'Pai de destino inexistente.');
  const parent = spec.elements[op.parentId];
  const slot = own(op, 'slot') ? op.slot : null;
  if (slot !== null && (!record(parent.slots) || !own(parent.slots, slot)))
    reject('invalid_slot', 'O slot de destino deve existir no nó pai.');
  const list = slot === null ? parent.children : parent.slots[slot];
  if (!Array.isArray(list)) reject('invalid_slot', 'A lista de destino é inválida.');
  const index = own(op, 'index') ? op.index : list.length;
  if (index > list.length) reject('invalid_index', 'index ultrapassa os limites da lista de destino.');
  return { list, index, slot };
}
function applyOne(spec, op) {
  const elements = spec.elements;
  if (op.op === 'add') {
    if (own(elements, op.nodeId)) reject('duplicate_id', 'Identificador já utilizado na árvore.');
    const { list, index, slot } = target(spec, op);
    elements[op.nodeId] = structuredClone(op.node);
    list.splice(index, 0, op.nodeId);
    return { op: 'add', nodeId: op.nodeId, parentId: op.parentId, slot, index };
  }
  if (!own(elements, op.nodeId)) reject('missing_node', 'Nó de origem inexistente.');
  if (op.op === 'update') {
    const props = elements[op.nodeId].props;
    const setKeys = Object.keys(op.setProps ?? {}), unsetKeys = op.unsetProps ?? [];
    for (const key of unsetKeys) {
      if (!own(props, key)) reject('missing_property', 'Propriedade inexistente: ' + key + '.');
      delete props[key];
    }
    for (const key of setKeys) Object.defineProperty(props, key, {
      value: structuredClone(op.setProps[key]), enumerable: true, writable: true, configurable: true,
    });
    return { op: 'update', nodeId: op.nodeId, setKeys, unsetKeys };
  }
  if (op.nodeId === spec.root) reject('root_protected', 'A raiz não pode ser removida ou movida.');
  const from = findParent(spec, op.nodeId);
  if (op.op === 'remove') {
    const removedIds = [...descendants(elements, op.nodeId)];
    from.list.splice(from.index, 1);
    for (const nodeId of removedIds) delete elements[nodeId];
    return { op: 'remove', nodeId: op.nodeId, removedIds };
  }
  if (descendants(elements, op.nodeId).has(op.parentId))
    reject('cycle', 'Um nó não pode ser movido para si ou para um descendente.');
  // Indices are in the FINAL destination list (after detaching the source).
  // Validate destinations before mutating, then validate same-list bounds after detach.
  const dest = target(spec, op);
  from.list.splice(from.index, 1);
  const index = own(op, 'index') ? op.index : dest.list.length;
  if (index > dest.list.length) reject('invalid_index', 'index inválido após remoção da origem.');
  dest.list.splice(index, 0, op.nodeId);
  return { op: 'move', nodeId: op.nodeId,
    from: { parentId: from.parentId, slot: from.slot, index: from.index },
    to: { parentId: op.parentId, slot: dest.slot, index } };
}

/**
 * Applies a versioned patch as one transaction. On any failure the original spec
 * is returned unchanged. Caller MUST supply the actual channel-specific Zod validator.
 * No persistence, external actions, rendering or Pi permission changes occur here.
 */
export function applyTreePatch(spec, patch, policy) {
  let index = null;
  try {
    if (!policy || typeof policy.validateSpec !== 'function' ||
      !Array.isArray(policy.allowedTypes) || !policy.allowedTypes.length ||
      !Array.isArray(policy.allowedActions) || !record(policy.allowedEvents))
      reject('missing_policy', 'É obrigatória uma política com validador Zod e allowlists explícitas.');
    assertJson(patch);
    strictFields(patch, ['schemaVersion', 'operations']);
    if (patch.schemaVersion !== 1 || !Array.isArray(patch.operations) ||
      !patch.operations.length || patch.operations.length > MAX_OPERATIONS)
      reject('invalid_patch', 'Patch v1 deve conter de 1 a ' + MAX_OPERATIONS + ' operações.');
    validateTree(spec, policy);
    let next = structuredClone(spec);
    const changes = [], reservedIds = new Set(Object.keys(next.elements));
    for (let i = 0; i < patch.operations.length; i++) {
      index = i;
      const operation = patch.operations[i];
      validateOperation(operation);
      // Deleting and re-adding an ID within one transaction would silently
      // substitute the identity of a previously referenced element.
      if (operation.op === 'add' && reservedIds.has(operation.nodeId) &&
        !own(next.elements, operation.nodeId))
        reject('id_reuse', 'ID removido nesta transação não pode ser reutilizado.');
      // Snapshot per operation: preservation is checked against the precise
      // previous tree, not just against the original batch input.
      const candidate = structuredClone(next);
      const change = applyOne(candidate, operation);
      validateTree(candidate, policy);
      const violation = preservationViolation(next, candidate, operation, change);
      if (violation) reject('preservation_violation', violation);
      next = candidate;
      changes.push(change);
      if (operation.op === 'add') reservedIds.add(operation.nodeId);
    }
    return { ok: true, spec: next, changes };
  } catch (error) {
    return { ok: false, spec, error: {
      opIndex: index, code: error instanceof PatchError ? error.code : 'patch_failed',
      message: error instanceof PatchError ? error.message : 'Falha inesperada ao aplicar patch.',
    } };
  }
}
