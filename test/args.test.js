import { test } from 'node:test';
import assert from 'node:assert/strict';
import { processArgs } from '../utils/args.js';

test('parses -o with a space-separated value (docker usage)', () => {
  assert.deepEqual(processArgs(['-y', '-o', '/usr/share/nginx/html', 'vite']), {
    no_public: false, yes: true, out: '/usr/share/nginx/html', builder: 'vite',
  });
});

test('parses --out= form and defaults', () => {
  assert.equal(processArgs(['--out=dist']).out, 'dist');
  assert.equal(processArgs([]).out, './public');
});

test('rejects unknown args and a missing -o value', () => {
  assert.throws(() => processArgs(['--bogus']));
  assert.throws(() => processArgs(['-o']));
});
