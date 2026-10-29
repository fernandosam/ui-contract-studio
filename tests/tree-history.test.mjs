import test from 'node:test';
import assert from 'node:assert/strict';
import { applyTreePatch } from '../scripts/lib/spec-tree-operations.mjs';
import { createTreeEditSession, diffTreeSpecs } from '../scripts/lib/spec-tree-history.mjs';

const text = value => ({ type: 'Text', props: { text: value }, children: [] });
const make = () => ({
  root: 'root',
  state: { selected: 'first', nested: { unchanged: true } },
  elements: {
    root: { type: 'Card', props: { title: 'Card' }, children: ['group', 'last'] },
    group: { type: 'Stack', props: {}, children: ['first', 'second'], slots: { auxiliary: [] } },
    first: text('original'), second: text('second'), last: text('last'),
  },
});
const policy = {
  allowedTypes: ['Card', 'Stack', 'Text'], allowedActions: [],
  allowedEvents: { Card: {}, Stack: { slots: ['auxiliary'] }, Text: {} },
  validateSpec: spec => ({ success: !Object.values(spec.elements ?? {}).some(node =>
    !['Card', 'Stack', 'Text'].includes(node.type) ||
    Object.hasOwn(node.props ?? {}, 'forbidden') ||
    (node.type === 'Text' && (typeof node.props?.text !== 'string' ||
      Object.keys(node.props).some(k => k !== 'text')))) }),
};
const patch = (...operations) => ({ schemaVersion: 1, operations });
const session = (spec = make(), validate = policy) =>
  createTreeEditSession(spec, (tree, operations) => applyTreePatch(tree, operations, validate));
const stage = (editor, ...operations) => {
  const preview = editor.preview(patch(...operations));
  assert.equal(preview.ok, true, JSON.stringify(preview));
  return preview;
};
const apply = (editor, ...operations) => {
  stage(editor, ...operations);
  const committed = editor.commit();
  assert.equal(committed.ok, true, JSON.stringify(committed));
  return committed;
};

test('E08: preview is non-mutating, and diff omits field values', () => {
  const original = make(), editor = session(original);
  const preview = stage(editor, { op: 'update', nodeId: 'first', setProps: { text: 'SECRET_DO_NOT_LOG' } });
  assert.deepEqual(preview.diff, {
    added: [], removed: [], moved: [],
    properties: [{ nodeId: 'first', addedKeys: [], removedKeys: [], changedKeys: ['text'] }],
  });
  assert.equal(JSON.stringify(preview.diff).includes('SECRET_DO_NOT_LOG'), false);
  assert.equal(JSON.stringify(editor.read().history).includes('SECRET_DO_NOT_LOG'), false);
  assert.deepEqual(editor.read().spec, original);
  assert.deepEqual(original, make());
  assert.equal(editor.read().revision, 0);
  assert.equal(editor.commit().ok, true);
  assert.equal(editor.read().spec.elements.first.props.text, 'SECRET_DO_NOT_LOG');
  assert.equal(JSON.stringify(editor.read().history).includes('SECRET_DO_NOT_LOG'), false);
});

test('E08: preview handles add/remove/move/slots and only reports explicit relocations', () => {
  const editor = session();
  const addition = stage(editor, { op: 'add', nodeId: 'new', parentId: 'group', index: 0, node: text('new') });
  assert.deepEqual(addition.diff.added, ['new']);
  assert.deepEqual(addition.diff.moved, []); // shifted siblings are not separate moves
  assert.equal(editor.commit().ok, true);
  const relocation = stage(editor, { op: 'move', nodeId: 'first', parentId: 'group', slot: 'auxiliary', index: 0 });
  assert.equal(relocation.diff.moved.length, 1);
  assert.deepEqual(relocation.diff.moved[0], {
    nodeId: 'first',
    from: { parentId: 'group', slot: null, index: 1 },
    to: { parentId: 'group', slot: 'auxiliary', index: 0 },
  });
  assert.equal(editor.commit().ok, true);
  const removal = stage(editor, { op: 'remove', nodeId: 'group' });
  assert.deepEqual(removal.diff.removed.sort(), ['first', 'group', 'new', 'second']);
  assert.deepEqual(editor.read().spec.elements.group.slots.auxiliary, ['first']); // preview only
});

test('E08: undo/redo round trips the full spec including IDs, slots, state, and untouched subtrees', () => {
  const original = make(), editor = session(original);
  apply(editor, { op: 'update', nodeId: 'first', setProps: { text: 'changed' } });
  const snapshot1 = editor.read().spec;
  apply(editor, { op: 'move', nodeId: 'second', parentId: 'group', slot: 'auxiliary' });
  const snapshot2 = editor.read().spec;
  assert.equal(editor.undo().ok, true);
  assert.deepEqual(editor.read().spec, snapshot1);
  assert.deepEqual(editor.read().spec.state, original.state);
  assert.deepEqual(editor.read().spec.elements.last, original.elements.last);
  assert.equal(editor.undo().ok, true);
  assert.deepEqual(editor.read().spec, original);
  assert.equal(editor.redo().ok, true);
  assert.deepEqual(editor.read().spec, snapshot1);
  assert.equal(editor.redo().ok, true);
  assert.deepEqual(editor.read().spec, snapshot2);
  assert.equal(editor.read().canRedo, false);
  assert.equal(editor.redo().error.code, 'history_boundary');
  assert.deepEqual(original, make());
});

test('E08: new commit after undo clears redo, no-op never enters history', () => {
  const editor = session();
  apply(editor, { op: 'update', nodeId: 'first', setProps: { text: 'one' } });
  apply(editor, { op: 'update', nodeId: 'first', setProps: { text: 'two' } });
  assert.equal(editor.undo().ok, true);
  assert.equal(editor.read().canRedo, true);
  assert.equal(editor.preview(patch({ op: 'update', nodeId: 'first', setProps: { text: 'one' } })).error.code, 'no_changes');
  assert.equal(editor.commit().error.code, 'stale_preview');
  apply(editor, { op: 'update', nodeId: 'first', setProps: { text: 'other' } });
  assert.equal(editor.read().canRedo, false);
  assert.deepEqual(editor.read().history.map(h => h.id), [1, 3]);
  assert.equal(editor.read().cursor, 2);
});

test('E08: invalid preview cancels previous staging, never changes history or current spec', () => {
  const editor = session(), original = editor.read().spec;
  stage(editor, { op: 'update', nodeId: 'first', setProps: { text: 'valid' } });
  const invalid = editor.preview(patch({ op: 'update', nodeId: 'first', setProps: { forbidden: 'secret' } }));
  assert.equal(invalid.ok, false);
  assert.equal(invalid.error.code, 'schema_invalid');
  assert.equal(editor.commit().error.code, 'stale_preview');
  assert.deepEqual(editor.read().spec, original);
  assert.equal(editor.read().history.length, 0);
  assert.equal(editor.preview(patch({ op: 'remove', nodeId: 'root' })).ok, false);
  assert.equal(editor.preview({ schemaVersion: 999, operations: [] }).ok, false);
});

test('E08: exported snapshots and summaries cannot mutate private session data', () => {
  const editor = session();
  const proposed = stage(editor, { op: 'update', nodeId: 'first', setProps: { text: 'safe' } });
  proposed.spec.elements.first.props.text = 'tampered preview';
  proposed.diff.properties[0].changedKeys[0] = 'tampered key';
  editor.read().spec.elements.first.props.text = 'tampered current';
  assert.equal(editor.commit().ok, true);
  assert.equal(editor.read().spec.elements.first.props.text, 'safe');
  editor.read().history[0].diff.properties[0].changedKeys[0] = 'tampered history';
  assert.deepEqual(editor.read().history[0].diff.properties[0].changedKeys, ['text']);
});

test('E08: bounded history retains a valid baseline and supports undo/redo', () => {
  const editor = createTreeEditSession(make(),
    (spec, operations) => applyTreePatch(spec, operations, policy), { maxEntries: 2 });
  for (const name of ['one', 'two', 'three']) {
    apply(editor, { op: 'update', nodeId: 'first', setProps: { text: name } });
  }
  assert.equal(editor.read().history.length, 2);
  assert.equal(editor.undo().ok, true);
  assert.equal(editor.undo().ok, true);
  assert.equal(editor.read().spec.elements.first.props.text, 'one');
  assert.equal(editor.undo().error.code, 'history_boundary');
  assert.equal(editor.redo().ok, true);
  assert.equal(editor.redo().ok, true);
  assert.equal(editor.read().spec.elements.first.props.text, 'three');
  assert.throws(() => createTreeEditSession(make(), () => {}, { maxEntries: 0 }), RangeError);
});

test('E08: redo replays validated patches and fails safely if policy later rejects them', () => {
  let deny = false;
  const custom = { ...policy, validateSpec: spec => ({
    success: !deny && policy.validateSpec(spec).success,
  }) };
  const editor = session(make(), custom);
  apply(editor, { op: 'update', nodeId: 'first', setProps: { text: 'approved' } });
  assert.equal(editor.undo().ok, true);
  const unchanged = editor.read();
  deny = true;
  const result = editor.redo();
  assert.equal(result.ok, false);
  assert.equal(result.error.code, 'history_invalid');
  assert.deepEqual(editor.read(), unchanged);
});

test('E08: changed properties are compared structurally without storing values in the diff', () => {
  const before = make(), after = structuredClone(before);
  after.elements.root.props.title = 'some sensitive title';
  after.elements.root.props.subtitle = 'secret new';
  delete after.elements.first.props.text;
  const diff = diffTreeSpecs(before, after);
  assert.deepEqual(diff.properties, [
    { nodeId: 'first', addedKeys: [], removedKeys: ['text'], changedKeys: [] },
    { nodeId: 'root', addedKeys: ['subtitle'], removedKeys: [], changedKeys: ['title'] },
  ]);
  assert.equal(JSON.stringify(diff).includes('secret'), false);
});
