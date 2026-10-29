import test from 'node:test';
import assert from 'node:assert/strict';
import { applyTreePatch } from '../scripts/lib/spec-tree-operations.mjs';
import { createTreeEditSession } from '../scripts/lib/spec-tree-history.mjs';

const textNode = text => ({ type: 'Text', props: { text }, children: [] });
const buttonNode = () => ({
  type: 'Button', props: { label: 'Salvar' }, children: [],
  on: { click: [{ action: 'setState', params: { statePath: 'form.submitted', value: true } }] },
  visible: { $state: 'form.visible' },
});
const make = () => ({
  root: 'root',
  state: { form: { value: 'unchanged', visible: true, submitted: false }, selectedId: 'field' },
  elements: {
    root: { type: 'Stack', props: {}, children: ['left', 'right', 'action'] },
    left: { type: 'Stack', props: {}, children: ['first', 'field'], slots: { auxiliary: ['hint'] } },
    right: { type: 'Stack', props: {}, children: ['other'] },
    first: textNode('First'),
    field: textNode('Field'),
    hint: textNode('Hint'),
    other: textNode('Other'),
    action: buttonNode(),
  },
});
const allowed = new Set(['Stack', 'Text', 'Button']);
const policy = {
  allowedTypes: [...allowed],
  allowedActions: ['setState'],
  allowedEvents: { Stack: { slots: ['auxiliary'] }, Text: {}, Button: { events: ['click'] } },
  validateSpec: spec => ({
    success: Object.values(spec.elements ?? {}).every(node =>
      allowed.has(node.type) && (
        node.type === 'Stack' ? Object.keys(node.props).length === 0 :
        node.type === 'Text' ? Object.keys(node.props).length === 1 && typeof node.props.text === 'string' :
        Object.keys(node.props).length === 1 && typeof node.props.label === 'string'
      )),
  }),
};
const patch = (...operations) => ({ schemaVersion: 1, operations });
const update = (nodeId, text) => ({ op: 'update', nodeId, setProps: { text } });
const apply = (spec, ...operations) => applyTreePatch(spec, patch(...operations), policy);
const editor = (validate = policy) =>
  createTreeEditSession(make(), (spec, change) => applyTreePatch(spec, change, validate));
function commit(session, ...operations) {
  const staged = session.preview(patch(...operations));
  assert.equal(staged.ok, true, JSON.stringify(staged));
  const result = session.commit();
  assert.equal(result.ok, true, JSON.stringify(result));
  return result;
}

test('E08 regression: partial edits preserve IDs, foreign branches, state, action wiring and slots', () => {
  const original = make(), frozen = structuredClone(original);
  const result = apply(original,
    update('first', 'Edited'),
    { op: 'move', nodeId: 'field', parentId: 'right', index: 1 },
    { op: 'add', nodeId: 'newHint', parentId: 'left', slot: 'auxiliary', node: textNode('New hint') },
  );
  assert.equal(result.ok, true, JSON.stringify(result));
  assert.deepEqual(original, frozen);
  assert.deepEqual(result.spec.state, frozen.state);
  assert.deepEqual(result.spec.elements.root, frozen.elements.root);
  assert.deepEqual(result.spec.elements.action, frozen.elements.action);
  assert.deepEqual(result.spec.elements.other, frozen.elements.other);
  assert.deepEqual(result.spec.elements.hint, frozen.elements.hint);
  assert.deepEqual(result.spec.elements.field, frozen.elements.field);
  assert.deepEqual(result.spec.elements.left.children, ['first']);
  assert.deepEqual(result.spec.elements.left.slots.auxiliary, ['hint', 'newHint']);
  assert.deepEqual(result.spec.elements.right.children, ['other', 'field']);
  assert.deepEqual(Object.keys(result.spec.elements).sort(),
    [...Object.keys(frozen.elements), 'newHint'].sort());
});

test('E08 regression: successive partial commits undo/redo without changing form behavior', () => {
  const session = editor(), original = session.read().spec;
  commit(session, update('first', 'Updated'));
  const revision1 = session.read().spec;
  commit(session, { op: 'move', nodeId: 'field', parentId: 'right', index: 0 });
  const revision2 = session.read().spec;
  commit(session, { op: 'add', nodeId: 'newHint', parentId: 'left',
    slot: 'auxiliary', node: textNode('Auxiliary') });
  const revision3 = session.read().spec;
  for (const expected of [revision2, revision1, original]) {
    assert.equal(session.undo().ok, true);
    assert.deepEqual(session.read().spec, expected);
  }
  for (const expected of [revision1, revision2, revision3]) {
    assert.equal(session.redo().ok, true);
    assert.deepEqual(session.read().spec, expected);
    assert.deepEqual(session.read().spec.state, original.state);
    assert.deepEqual(session.read().spec.elements.action, original.elements.action);
  }
  assert.deepEqual(make(), original);
});

test('E08 regression: a conflicting second edit rolls back the entire transaction', () => {
  const conflicts = [
    [{ op: 'add', nodeId: 'first', parentId: 'right', node: textNode('Impostor') }, 'duplicate_id'],
    [{ op: 'update', nodeId: 'absent', setProps: { text: 'Missing' } }, 'missing_node'],
    [{ op: 'move', nodeId: 'left', parentId: 'field' }, 'cycle'],
    [{ op: 'add', nodeId: 'extra', parentId: 'left', slot: 'unknown', node: textNode('No slot') }, 'invalid_slot'],
    [{ op: 'move', nodeId: 'right', parentId: 'root', index: 3 }, 'invalid_index'],
    [{ op: 'update', nodeId: 'field', setProps: { text: 'Both' }, unsetProps: ['text'] }, 'invalid_update'],
    [{ op: 'update', nodeId: 'field', setProps: { forbidden: 'PRIVATE_VALUE' } }, 'schema_invalid'],
    [{ op: 'add', nodeId: 'hidden', parentId: 'field', node: textNode('Invisible') }, 'layout_invalid'],
    [{ op: 'add', nodeId: 'badSlot', parentId: 'right',
      node: { ...textNode('Invalid'), slots: { secret: [] } } }, 'graph_invalid'],
  ];
  for (const [operation, code] of conflicts) {
    const before = make(), snapshot = structuredClone(before);
    const result = apply(before, update('first', 'Temporarily changed'), operation);
    assert.equal(result.ok, false, JSON.stringify(operation));
    assert.equal(result.error.code, code, JSON.stringify(result));
    assert.equal(result.error.opIndex, 1);
    assert.equal(result.spec, before, 'rollback must retain the original input object');
    assert.deepEqual(before, snapshot);
    assert.doesNotMatch(JSON.stringify(result.error), /PRIVATE_VALUE|Temporarily changed/);
  }
});

test('E08 regression: deleted ancestors, ID reuse and invalid intermediate states are conflicts', () => {
  const scenarios = [
    [patch({ op: 'remove', nodeId: 'left' }, update('field', 'Gone')), 1, 'missing_node'],
    [patch({ op: 'remove', nodeId: 'field' }, { op: 'add', nodeId: 'field',
      parentId: 'right', node: textNode('Replacement') }), 1, 'id_reuse'],
    [patch({ op: 'add', nodeId: 'newId', parentId: 'left', node: textNode('Temporary') },
      { op: 'remove', nodeId: 'newId' },
      { op: 'add', nodeId: 'newId', parentId: 'right', node: textNode('Replacement') }), 2, 'id_reuse'],
    [patch({ op: 'add', nodeId: 'hidden', parentId: 'field', node: textNode('Invalid intermediary') },
      { op: 'remove', nodeId: 'hidden' }), 0, 'layout_invalid'],
  ];
  for (const [change, index, code] of scenarios) {
    const original = make();
    const result = applyTreePatch(original, change, policy);
    assert.equal(result.ok, false, JSON.stringify(result));
    assert.equal(result.error.opIndex, index);
    assert.equal(result.error.code, code);
    assert.equal(result.spec, original);
    assert.deepEqual(original, make());
  }
});

test('E08 regression: failed preview discards staging, does not create history or leak contents', () => {
  const session = editor(), before = session.read();
  assert.equal(session.preview(patch(update('first', 'Would be valid'))).ok, true);
  const invalid = session.preview(patch({ op: 'update', nodeId: 'first',
    setProps: { forbidden: 'SECRET_IN_FORM' } }));
  assert.equal(invalid.ok, false);
  assert.equal(invalid.error.code, 'schema_invalid');
  assert.doesNotMatch(JSON.stringify(invalid.error), /SECRET_IN_FORM/);
  assert.equal(session.commit().error.code, 'stale_preview');
  assert.deepEqual(session.read(), before);
});

test('E08 regression: policy drift between preview and commit is detected as a conflict', () => {
  let allow = true;
  const validator = { ...policy, validateSpec: spec => ({
    success: allow && policy.validateSpec(spec).success,
  }) };
  const session = editor(validator), before = session.read();
  assert.equal(session.preview(patch(update('first', 'Candidate'))).ok, true);
  allow = false;
  const result = session.commit();
  assert.equal(result.ok, false);
  assert.equal(result.error.code, 'stale_preview');
  assert.deepEqual(session.read(), before);
  allow = true;
  commit(session, update('first', 'Allowed after re-preview'));
  assert.equal(session.read().history.length, 1);
});

test('E08 regression: divergent replay and changed authorization preserve current revision', () => {
  let allowFirst = true;
  const validator = { ...policy, validateSpec: spec => ({
    success: policy.validateSpec(spec).success &&
      (allowFirst || spec.elements.first.props.text !== 'one'),
  }) };
  const session = editor(validator);
  commit(session, update('first', 'one'));
  commit(session, update('first', 'two'));
  const before = session.read();
  allowFirst = false;
  const failed = session.undo();
  assert.equal(failed.ok, false);
  assert.equal(failed.error.code, 'history_invalid');
  assert.deepEqual(session.read(), before);
  allowFirst = true;
  assert.equal(session.undo().ok, true);
  assert.equal(session.read().spec.elements.first.props.text, 'one');
});

test('E08 regression: post-preview mutation cannot change the validated commit or value-free diff', () => {
  const session = editor();
  const change = patch(update('first', 'DO_NOT_LOG_CONTENT'));
  const preview = session.preview(change);
  assert.equal(preview.ok, true);
  change.operations[0].setProps.text = 'Tampered after preview';
  preview.spec.elements.first.props.text = 'Tampered preview';
  assert.equal(session.commit().ok, true);
  assert.equal(session.read().spec.elements.first.props.text, 'DO_NOT_LOG_CONTENT');
  assert.equal(JSON.stringify(session.read().history).includes('DO_NOT_LOG_CONTENT'), false);
  assert.deepEqual(session.read().spec.state, make().state);
  assert.deepEqual(session.read().spec.elements.action, make().elements.action);
});
