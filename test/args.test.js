import { test } from 'node:test';
import assert from 'node:assert/strict';
import { processArgs } from '../utils/args.js';

const DEFAULTS = {
  no_public: false, yes: false, dry_run: false, out: './public', builder: 'all',
  prefixes: [], env_files: [], global: 'env', filename: 'env.js',
};

test('parses -o with a space-separated value (docker usage)', () => {
  assert.deepEqual(processArgs(['-y', '-o', '/usr/share/nginx/html', 'vite']), {
    ...DEFAULTS, yes: true, out: '/usr/share/nginx/html', builder: 'vite',
  });
});

test('parses --out= form and defaults', () => {
  assert.equal(processArgs(['--out=dist']).out, 'dist');
  assert.equal(processArgs(['-o=dist']).out, 'dist');
  assert.deepEqual(processArgs([]), DEFAULTS);
});

test('rejects unknown args and a missing -o value', () => {
  assert.throws(() => processArgs(['--bogus']));
  assert.throws(() => processArgs(['-o']));
  assert.throws(() => processArgs(['--out=']));
  assert.throws(() => processArgs(['--yes=1']));
});

test('collects repeatable --prefix and --dotenv', () => {
  const args = processArgs(['--prefix', 'APP_', '--prefix=FEATURE_', '--dotenv', '.env.production', '--dotenv=.env']);
  assert.deepEqual(args.prefixes, ['APP_', 'FEATURE_']);
  assert.deepEqual(args.env_files, ['.env.production', '.env']);
});

test('parses --global, --filename and --dry-run', () => {
  const args = processArgs(['--global', '__ENV__', '--filename=config.js', '--dry-run']);
  assert.equal(args.global, '__ENV__');
  assert.equal(args.filename, 'config.js');
  assert.equal(args.dry_run, true);
});

test('help and version short-circuit parsing', () => {
  assert.deepEqual(processArgs(['vite', '--help']), { help: true });
  assert.deepEqual(processArgs(['-v']), { version: true });
});
