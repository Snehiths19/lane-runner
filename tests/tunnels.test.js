import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tunnelsBetween } from '../src/tunnels.js';

const rules = { every: 400, length: 60, height: 8.5 };

test('no tunnel before the first one', () => {
  assert.deepEqual(tunnelsBetween(0, 390, rules), []);
});

test('tunnels repeat every `every` metres, each `length` long', () => {
  assert.deepEqual(tunnelsBetween(0, 900, rules), [{ start: 400, end: 460 }, { start: 800, end: 860 }]);
});

test('a tunnel the view range only partly covers is included', () => {
  assert.deepEqual(tunnelsBetween(450, 500, rules), [{ start: 400, end: 460 }]);
  assert.deepEqual(tunnelsBetween(461, 799, rules), []);
});
