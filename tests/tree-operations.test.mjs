import test from 'node:test';
import assert from 'node:assert/strict';
import { applyTreePatch } from '../scripts/lib/spec-tree-operations.mjs';
import { graphErrors } from '../scripts/lib/spec-invariants.mjs';

const t = (text) => ({ type: 'Text', props: { text }, children: [] });
const make = () => ({
  root: 'root', elements: {
    root: { type: 'Card', props: { title: null, description: null }, children: ['group', 'last'] },
    group: { type: 'Stack', props: {}, children: ['first', 'second'], slots: { auxiliary: [] } },
    first: t('1'), second: t('2'), last: t('3'),
  },
});
const policy = {
  allowedTypes: ['Card', 'Stack', 'Text'], allowedActions: [],
  allowedEvents: { Card: { slots: ['default'] }, Stack: { slots: ['auxiliary'] }, Text: {} },
  validateSpec: spec => ({ success: !Object.entries(spec.elements ?? {}).some(([,node]) =>
    node.props?.forbidden !== undefined || node.type === 'Unknown' ||
    (node.type === 'Text' && (typeof node.props?.text !== 'string' || Object.keys(node.props).some(k => k !== 'text')))) }),
};
const apply = (spec, operations) => applyTreePatch(spec, { schemaVersion: 1, operations }, policy);
const assertClean = spec => assert.deepEqual(graphErrors(spec, policy.allowedTypes, policy), []);

test('E08: add at index and into declared slot, with stable element ids', () => {
  const initial = make();
  const result = apply(initial, [
    { op: 'add', nodeId: 'between', parentId: 'group', index: 1, node: t('new') },
    { op: 'add', nodeId: 'extra', parentId: 'group', slot: 'auxiliary', node: t('slot') },
  ]);
  assert.equal(result.ok, true, JSON.stringify(result));
  assert.deepEqual(result.spec.elements.group.children, ['first', 'between', 'second']);
  assert.deepEqual(result.spec.elements.group.slots.auxiliary, ['extra']);
  assert.deepEqual(initial.elements.group.children, ['first', 'second']);
  assertClean(result.spec);
});

test('E08: remove recursively deletes nested nodes from all child/slot lists', () => {
  const original = make();
  const result = apply(original, [{ op: 'remove', nodeId: 'group' }]);
  assert.equal(result.ok, true, JSON.stringify(result));
  assert.deepEqual(result.spec.elements.root.children, ['last']);
  assert.deepEqual(Object.keys(result.spec.elements).sort(), ['last', 'root']);
  assert.deepEqual(result.changes[0].removedIds.sort(), ['first', 'group', 'second']);
  assert.ok(original.elements.group);
  assertClean(result.spec);
});

test('E08: move across parent and slot, and reorder with final-list index', () => {
  const result = apply(make(), [
    { op: 'move', nodeId: 'second', parentId: 'root', index: 1 },
    { op: 'move', nodeId: 'first', parentId: 'group', slot: 'auxiliary' },
    { op: 'move', nodeId: 'second', parentId: 'root', index: 0 },
  ]);
  assert.equal(result.ok, true, JSON.stringify(result));
  assert.deepEqual(result.spec.elements.root.children, ['second', 'group', 'last']);
  assert.deepEqual(result.spec.elements.group.children, []);
  assert.deepEqual(result.spec.elements.group.slots.auxiliary, ['first']);
  assertClean(result.spec);
});

test('E08: update props using set/unset without modifying type, id or actions', () => {
  const result = apply(make(), [{ op: 'update', nodeId: 'first', setProps: { text: 'alterado' } }]);
  assert.equal(result.ok, true);
  assert.equal(result.spec.elements.first.props.text, 'alterado');
  assert.equal(result.spec.elements.first.type, 'Text');
  assert.deepEqual(result.changes[0].setKeys, ['text']);
  assertClean(result.spec);
});

test('E08: full batch rollback when a later operation fails', () => {
  const original = make(), snapshot = structuredClone(original);
  const result = apply(original, [
    { op: 'add', nodeId: 'temporary', parentId: 'root', node: t('ok') },
    { op: 'update', nodeId: 'first', setProps: { forbidden: 'not approved' } },
  ]);
  assert.equal(result.ok, false);
  assert.equal(result.error.opIndex, 1);
  assert.equal(result.error.code, 'schema_invalid');
  assert.deepEqual(result.spec, snapshot);
  assert.deepEqual(original, snapshot);
});

test('E08: fail closed for root mutation, descendant cycle, duplicate ids, bad indexes and missing parents/slots', () => {
  const invalid = [
    [{ op: 'remove', nodeId: 'root' }, 'root_protected'],
    [{ op: 'move', nodeId: 'root', parentId: 'group' }, 'root_protected'],
    [{ op: 'move', nodeId: 'group', parentId: 'first' }, 'cycle'],
    [{ op: 'add', nodeId: 'first', parentId: 'root', node: t('x') }, 'duplicate_id'],
    [{ op: 'add', nodeId: 'x', parentId: 'missing', node: t('x') }, 'missing_parent'],
    [{ op: 'move', nodeId: 'last', parentId: 'root', slot: 'nonexistent' }, 'invalid_slot'],
    [{ op: 'move', nodeId: 'last', parentId: 'root', index: 2 }, 'invalid_index'],
    [{ op: 'add', nodeId: 'x', parentId: 'root', index: 50, node: t('x') }, 'invalid_index'],
  ];
  for (const [operation, expected] of invalid) {
    const original = make(), result = apply(original, [operation]);
    assert.equal(result.ok, false, JSON.stringify(operation));
    assert.equal(result.error.code, expected, JSON.stringify(operation));
    assert.deepEqual(result.spec, original);
  }
});

test('E08: rejects unsafe input, malformed/unknown ops, oversized batches and stale starting trees', () => {
  const invalid = [
    [{ op: 'update', nodeId: 'first', setProps: { text: 'x' }, unsetProps: ['text'] }, 'invalid_update'],
    [{ op: 'update', nodeId: 'first', setProps: {} }, 'invalid_update'],
    [{ op: 'update', nodeId: 'first', unsetProps: ['absent'] }, 'missing_property'],
    [{ op: 'add', nodeId: '__proto__', parentId: 'root', node: t('x') }, 'invalid_id'],
    [{ op: 'add', nodeId: 'new', parentId: 'root', node: { ...t('x'), children: ['first'] } }, 'invalid_node'],
    [{ op: 'changeType', nodeId: 'first', type: 'Unknown' }, 'invalid_operation'],
    [{ op: 'remove', nodeId: 'first', extra: true }, 'invalid_operation'],
  ];
  for (const [operation, expected] of invalid) {
    const result = apply(make(), [operation]);
    assert.equal(result.ok, false, JSON.stringify(operation));
    assert.equal(result.error.code, expected, JSON.stringify(operation));
  }
  const over = applyTreePatch(make(), {schemaVersion: 1, operations: Array(51).fill({op:'remove',nodeId:'first'})}, policy);
  assert.equal(over.ok, false); assert.equal(over.error.code, 'invalid_patch');
  const malicious = JSON.parse('{"schemaVersion":1,"operations":[{"op":"update","nodeId":"first","setProps":{"__proto__":{}}}]}');
  assert.equal(applyTreePatch(make(), malicious, policy).error.code, 'invalid_json');
  const noPolicy = applyTreePatch(make(), {schemaVersion:1,operations:[{op:'remove',nodeId:'last'}]}, {});
  assert.equal(noPolicy.error.code, 'missing_policy');
  const stale = make(); stale.elements.first.type='Unknown';
  assert.equal(apply(stale,[{op:'remove',nodeId:'first'}]).error.code,'schema_invalid');
});

test('E08: undeclared slots and new event handlers are not introduced by edits', () => {
  const slotAttempt = apply(make(), [{ op: 'add', nodeId: 'badSlot', parentId: 'root',
    node: { ...t('bad'), slots: { secret: [] } } }]);
  assert.equal(slotAttempt.ok, false);
  assert.equal(slotAttempt.error.code, 'graph_invalid');
  const eventAttempt = apply(make(), [{ op: 'add', nodeId: 'badEvent', parentId: 'root',
    node: { ...t('bad'), on: { click: [{ action: 'buttonClick' }] } } }]);
  assert.equal(eventAttempt.ok, false);
  assert.equal(eventAttempt.error.code, 'invalid_node');
});
