import test from 'node:test';
import assert from 'node:assert/strict';
import { applyTreePatch } from '../scripts/lib/spec-tree-operations.mjs';

const textNode = text => ({ type: 'Text', props: { text }, children: [] });
const heading = text => ({ type: 'Heading', props: { text, level: 'h2' }, children: [] });
const screen = () => ({ root: 'root', elements: {
  root: { type: 'Stack', props: { direction: 'vertical' }, children: ['title', 'body'] },
  title: heading('Title'), body: textNode('Original'),
}});
const policy = {
  allowedTypes: ['Stack', 'Text', 'Heading'],
  allowedActions: [],
  allowedEvents: { Stack: { slots: ['default'] }, Text: {}, Heading: {} },
  validateSpec: spec => ({ success: Object.values(spec.elements).every(node =>
    node.type === 'Stack' || ((node.type === 'Text' || node.type === 'Heading') &&
      typeof node.props.text === 'string')) }),
};
const patch = (...operations) => ({ schemaVersion: 1, operations });
const update = (nodeId, text) => ({ op: 'update', nodeId, setProps: { text } });

test('E08 layout: checks every intermediate edit, preserving input and original state', () => {
  const original = screen(), calls = [];
  const result = applyTreePatch(original, patch(update('body', 'One'), update('title', 'New title')), {
    ...policy,
    validateLayout: candidate => { calls.push(candidate.elements.body.props.text); return { success: true }; },
  });
  assert.equal(result.ok, true, JSON.stringify(result));
  assert.deepEqual(calls, ['Original', 'One', 'One']);
  assert.equal(result.spec.elements.title.props.text, 'New title');
  assert.equal(original.elements.body.props.text, 'Original');
});

test('E08 layout: reject invisible children on text/heading, even with Zod-valid tree', () => {
  const cases = [
    { op: 'add', nodeId: 'hidden', parentId: 'body', node: textNode('Hidden') },
    { op: 'move', nodeId: 'title', parentId: 'body' },
    update('title', ' '),
  ];
  for (const operation of cases) {
    const initial = screen(), snapshot = structuredClone(initial);
    const result = applyTreePatch(initial, patch(operation), policy);
    assert.equal(result.ok, false, JSON.stringify(operation));
    assert.equal(result.error.code, 'layout_invalid');
    assert.equal(result.error.opIndex, 0);
    assert.deepEqual(result.spec, snapshot);
    assert.deepEqual(initial, snapshot);
  }
});

test('E08 layout: a failed second operation rolls back the full patch', () => {
  const initial = screen();
  const result = applyTreePatch(initial, patch(
    update('body', 'Intermediate'),
    { op: 'move', nodeId: 'title', parentId: 'body' },
  ), policy);
  assert.equal(result.ok, false);
  assert.equal(result.error.code, 'layout_invalid');
  assert.equal(result.error.opIndex, 1);
  assert.equal(result.spec, initial);
  assert.equal(initial.elements.body.props.text, 'Original');
});

test('E08 layout: flow-specific validator is fail-closed; errors never leak node values', () => {
  const original = screen();
  for (const validateLayout of [
    () => ({ success: false, reason: 'SECRET-FROM-PROPS' }),
    () => { throw Error('SECRET-FROM-PROPS'); },
    () => null,
  ]) {
    const result = applyTreePatch(original, patch(update('body', 'Private value')), {
      ...policy, validateLayout,
    });
    assert.equal(result.ok, false);
    assert.equal(result.error.code, 'layout_invalid');
    assert.doesNotMatch(result.error.message, /SECRET-FROM-PROPS|Private value/);
    assert.equal(result.spec, original);
  }
});
