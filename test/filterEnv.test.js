import { test } from 'node:test';
import assert from 'node:assert/strict';
import { filterEnv, getPrefixes } from '../utils/filterEnv.js';

test('getPrefixes for each builder', () => {
  assert.deepEqual(getPrefixes(), ['PUBLIC_', 'VITE_', 'REACT_APP_']);
  assert.deepEqual(getPrefixes({ builder: 'vite' }), ['PUBLIC_', 'VITE_']);
  assert.deepEqual(getPrefixes({ builder: 'react-scripts' }), ['PUBLIC_', 'REACT_APP_']);
});

test('getPrefixes with noPublic and custom prefixes', () => {
  assert.deepEqual(getPrefixes({ builder: 'vite', noPublic: true }), ['VITE_']);
  assert.deepEqual(getPrefixes({ builder: 'vite', prefixes: ['APP_', 'VITE_'] }), ['PUBLIC_', 'VITE_', 'APP_']);
});

test('getPrefixes rejects an unknown builder', () => {
  assert.throws(() => getPrefixes({ builder: 'webpack' }), /Unknown builder/);
});

test('filterEnv keeps matching variables sorted by name', () => {
  const env = { VITE_B: 'b', SECRET: 's', PUBLIC_A: 'a', REACT_APP_C: 'c', VITE_UNSET: undefined };
  const vars = filterEnv(env, ['PUBLIC_', 'VITE_']);
  assert.deepEqual(vars, { PUBLIC_A: 'a', VITE_B: 'b' });
  assert.deepEqual(Object.keys(vars), ['PUBLIC_A', 'VITE_B']);
});
