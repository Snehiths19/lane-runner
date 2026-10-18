import { test } from 'node:test';
import assert from 'node:assert/strict';
import { classifySwipe, keyToAction } from '../src/input.js';

test('a short drag is not a swipe', () => {
  assert.equal(classifySwipe(20, 10), null);
});

test('horizontal swipes switch lanes', () => {
  assert.equal(classifySwipe(-40, 10), 'left');
  assert.equal(classifySwipe(40, -10), 'right');
});

test('vertical swipes jump and slide', () => {
  assert.equal(classifySwipe(5, -40), 'jump');
  assert.equal(classifySwipe(5, 40), 'slide');
});

test('keys map to actions', () => {
  const expected = {
    ArrowLeft: 'left', KeyA: 'left',
    ArrowRight: 'right', KeyD: 'right',
    ArrowUp: 'jump', KeyW: 'jump', Space: 'jump',
    ArrowDown: 'slide', KeyS: 'slide',
    KeyQ: null,
  };
  for (const [code, action] of Object.entries(expected)) assert.equal(keyToAction(code), action, code);
});
