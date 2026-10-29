import test from 'node:test';
import assert from 'node:assert/strict';
import { applyTreePatch } from '../scripts/lib/spec-tree-operations.mjs';
import { preservationViolation } from '../scripts/lib/spec-tree-preservation.mjs';

const textNode = value => ({ type: 'Text', props: { text: value }, children: [] });
const make = () => ({
  root: 'root',
  state: { draft: { value: 'preserve' }, selectedId: 'right', flags: [true, false] },
  elements: {
    root: { type: 'Card', props: { title: 'Layout' }, children: ['leftGroup', 'right'] },
    leftGroup: {
      type: 'Stack', props: { gap: 2 }, children: ['left', 'extra'],
      slots: { auxiliary: ['badge'], trailing: [] },
      visible: { $state: 'draft.value' },
    },
    left: textNode('Left'),
    extra: textNode('Extra'),
    badge: textNode('Badge'),
    right: textNode('Right'),
  },
});
const policy = {
  allowedTypes: ['Card', 'Stack', 'Text'],
  allowedActions: [],
  allowedEvents: {
    Card: { slots: [] }, Stack: { slots: ['auxiliary', 'trailing'] }, Text: {},
  },
  validateSpec: candidate => ({ success: Object.values(candidate.elements ?? {}).every(node =>
    ['Card', 'Stack', 'Text'].includes(node.type) &&
    (node.type !== 'Text' || typeof node.props?.text === 'string')) }),
};
const apply = (spec, operations) => applyTreePatch(spec, { schemaVersion: 1, operations }, policy);

test('E08 preservation: adding does not change old IDs, sibling order, state or other slots', () => {
  const before = make();
  const snapshot = structuredClone(before);
  const result = apply(before, [
    { op: 'add', nodeId: 'newNode', parentId: 'leftGroup', slot: 'trailing', node: textNode('New') },
  ]);
  assert.equal(result.ok, true, JSON.stringify(result));
  assert.deepEqual(before, snapshot);
  assert.deepEqual(result.spec.state, snapshot.state);
  assert.equal(result.spec.root, snapshot.root);
  assert.deepEqual(Object.keys(result.spec.elements).sort(),
    [...Object.keys(snapshot.elements), 'newNode'].sort());
  for (const id of Object.keys(snapshot.elements)) {
    if (id === 'leftGroup') continue;
    assert.deepEqual(result.spec.elements[id], snapshot.elements[id]);
  }
  assert.deepEqual(result.spec.elements.leftGroup.children, ['left', 'extra']);
  assert.deepEqual(result.spec.elements.leftGroup.slots.auxiliary, ['badge']);
  assert.deepEqual(result.spec.elements.leftGroup.slots.trailing, ['newNode']);
  assert.deepEqual(result.spec.elements.leftGroup.visible, snapshot.elements.leftGroup.visible);
});

test('E08 preservation: moves preserve all node payloads and unaffected references', () => {
  const before = make();
  const result = apply(before, [
    { op: 'move', nodeId: 'badge', parentId: 'root', index: 1 },
    { op: 'move', nodeId: 'left', parentId: 'leftGroup', slot: 'trailing', index: 0 },
    { op: 'move', nodeId: 'extra', parentId: 'leftGroup', index: 0 },
  ]);
  assert.equal(result.ok, true, JSON.stringify(result));
  assert.deepEqual(result.spec.elements.root.children, ['leftGroup', 'badge', 'right']);
  assert.deepEqual(result.spec.elements.leftGroup.children, ['extra']);
  assert.deepEqual(result.spec.elements.leftGroup.slots, { auxiliary: [], trailing: ['left'] });
  assert.deepEqual(result.spec.state, before.state);
  for (const id of Object.keys(before.elements)) {
    assert.deepEqual(result.spec.elements[id].props, before.elements[id].props);
    for (const key of ['type', 'on', 'visible', 'repeat'])
      assert.deepEqual(result.spec.elements[id][key], before.elements[id][key]);
  }
});

test('E08 preservation: removing a subtree retains all surviving IDs and their state', () => {
  const before = make();
  const result = apply(before, [{ op: 'remove', nodeId: 'leftGroup' }]);
  assert.equal(result.ok, true, JSON.stringify(result));
  assert.deepEqual(result.changes[0].removedIds.sort(), ['badge', 'extra', 'left', 'leftGroup']);
  assert.deepEqual(Object.keys(result.spec.elements).sort(), ['right', 'root']);
  assert.deepEqual(result.spec.elements.right, before.elements.right);
  assert.deepEqual(result.spec.elements.root.children, ['right']);
  assert.deepEqual(result.spec.state, before.state);
  assert.deepEqual(before, make());
});

test('E08 preservation: updates touch only selected props, not node identity or state', () => {
  const before = make();
  const result = apply(before, [
    { op: 'update', nodeId: 'right', setProps: { text: 'Edited' } },
  ]);
  assert.equal(result.ok, true, JSON.stringify(result));
  assert.deepEqual(result.spec.elements.right, textNode('Edited'));
  assert.deepEqual(result.spec.elements.leftGroup, before.elements.leftGroup);
  assert.deepEqual(result.spec.state, before.state);
  assert.deepEqual(result.spec.elements.root, before.elements.root);
});

test('E08 preservation: IDs deleted earlier in the batch cannot be recycled', () => {
  const before = make();
  for (const operations of [
    [{ op: 'remove', nodeId: 'left' },
      { op: 'add', nodeId: 'left', parentId: 'root', node: textNode('Impostor') }],
    [{ op: 'add', nodeId: 'temporary', parentId: 'root', node: textNode('Temp') },
      { op: 'remove', nodeId: 'temporary' },
      { op: 'add', nodeId: 'temporary', parentId: 'root', node: textNode('Different') }],
  ]) {
    const result = apply(before, operations);
    assert.equal(result.ok, false, JSON.stringify(result));
    assert.equal(result.error.code, 'id_reuse');
    assert.deepEqual(result.spec, before);
    assert.deepEqual(before, make());
  }
});

test('E08 preservation: the guard detects out-of-scope edits even in otherwise schema-valid trees', () => {
  const before = make();
  const op = { op: 'update', nodeId: 'right', setProps: { text: 'Edited' } };
  const change = { op: 'update', nodeId: 'right', setKeys: ['text'], unsetKeys: [] };
  const valid = structuredClone(before);
  valid.elements.right.props.text = 'Edited';
  assert.equal(preservationViolation(before, valid, op, change), null);

  const cases = [
    draft => { draft.state.draft.value = 'corrupted'; },
    draft => { draft.elements.left.props.text = 'corrupted'; },
    draft => { draft.elements.leftGroup.visible = false; },
    draft => { draft.elements.root.children.reverse(); },
    draft => { delete draft.elements.badge; },
    draft => { draft.elements.right.children = ['badge']; },
  ];
  for (const mutate of cases) {
    const after = structuredClone(valid);
    mutate(after);
    assert.ok(preservationViolation(before, after, op, change));
    assert.deepEqual(before, make());
  }
});

test('E08 preservation: the guard verifies exact sibling order and slot list changes', () => {
  const before = make();
  const op = { op: 'move', nodeId: 'badge', parentId: 'root', index: 1 };
  const change = {
    op: 'move', nodeId: 'badge',
    from: { parentId: 'leftGroup', slot: 'auxiliary', index: 0 },
    to: { parentId: 'root', slot: null, index: 1 },
  };
  const after = structuredClone(before);
  after.elements.leftGroup.slots.auxiliary = [];
  after.elements.root.children.splice(1, 0, 'badge');
  assert.equal(preservationViolation(before, after, op, change), null);

  const changedSibling = structuredClone(after);
  changedSibling.elements.root.children.reverse();
  assert.match(preservationViolation(before, changedSibling, op, change), /Referências|ordem/);

  const changedOtherSlot = structuredClone(after);
  changedOtherSlot.elements.leftGroup.slots.trailing.push('left');
  assert.match(preservationViolation(before, changedOtherSlot, op, change), /Referências|ordem/);
});
