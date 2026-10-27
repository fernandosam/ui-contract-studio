import test from 'node:test';
import assert from 'node:assert/strict';
import {resolvePattern,generatePatternPreview,supportedPatterns} from '../src/ui-requirements/patterns';
test('T33 pattern variants',()=>{assert.equal(supportedPatterns.length,4);for(const id of ['login','search','list','dashboard']){const x=generatePatternPreview(resolvePattern(id));assert.ok(x.elements[x.root]);}});
