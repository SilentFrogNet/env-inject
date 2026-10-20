import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { injectEnv } from '../index.js';

const withTempDir = async (fn) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'env-inject-'));
  try {
    await fn(dir);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
};

test('injectEnv writes the filtered variables', async () => {
  await withTempDir(async (dir) => {
    const result = await injectEnv({
      out: dir, builder: 'vite', envFiles: false, yes: true,
      env: { VITE_A: 'a', REACT_APP_B: 'b', PUBLIC_C: 'c', SECRET: 's' },
    });
    assert.deepEqual(result.vars, { PUBLIC_C: 'c', VITE_A: 'a' });
    assert.equal(result.written, true);
    assert.equal(fs.readFileSync(path.join(dir, 'env.js'), 'utf8'), result.content);
  });
});

test('injectEnv loads env files, with existing variables and earlier files winning', async () => {
  await withTempDir(async (dir) => {
    const prod = path.join(dir, '.env.production');
    const base = path.join(dir, '.env');
    fs.writeFileSync(prod, 'VITE_URL=prod\nVITE_ONLY_PROD=1\n');
    fs.writeFileSync(base, 'VITE_URL=base\nVITE_ONLY_BASE=1\nVITE_SET=file\n');

    const result = await injectEnv({
      out: dir, envFiles: [prod, base], dryRun: true,
      env: { VITE_SET: 'process' },
    });
    assert.deepEqual(result.vars, {
      VITE_ONLY_BASE: '1', VITE_ONLY_PROD: '1', VITE_SET: 'process', VITE_URL: 'prod',
    });
  });
});

test('injectEnv dry run does not write and supports custom names and prefixes', async () => {
  await withTempDir(async (dir) => {
    const result = await injectEnv({
      out: dir, envFiles: false, dryRun: true, globalName: '__ENV__', filename: 'config.js',
      prefixes: ['APP_'], env: { APP_X: 'x' },
    });
    assert.equal(result.written, false);
    assert.equal(result.filePath, path.join(dir, 'config.js'));
    assert.match(result.content, /^window\.__ENV__ = /);
    assert.deepEqual(result.vars, { APP_X: 'x' });
    assert.equal(fs.existsSync(result.filePath), false);
  });
});

test('injectEnv fails on a missing explicit env file', async () => {
  await assert.rejects(
    injectEnv({ envFiles: ['/does/not/exist.env'], dryRun: true, env: {} }),
    /Env file not found/
  );
});
