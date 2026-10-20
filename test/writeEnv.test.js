import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { buildEnvJsContent, resolveEnvFilePath, writeEnvFile } from '../utils/writeEnv.js';

test('buildEnvJsContent uses window.env by default', () => {
  assert.equal(buildEnvJsContent({ VITE_A: 'a' }), 'window.env = {\n  "VITE_A": "a"\n};\n');
});

test('buildEnvJsContent with a custom global', () => {
  assert.match(buildEnvJsContent({}, '__ENV__'), /^window\.__ENV__ = \{\};\n$/);
  assert.throws(() => buildEnvJsContent({}, 'not valid'), /Invalid global name/);
  assert.throws(() => buildEnvJsContent({}, 'a;alert(1)'), /Invalid global name/);
});

test('resolveEnvFilePath joins folder and file name', () => {
  assert.equal(resolveEnvFilePath('/srv/html', 'config.js'), path.join('/srv/html', 'config.js'));
  assert.equal(resolveEnvFilePath(), path.resolve(process.cwd(), 'public', 'env.js'));
  assert.throws(() => resolveEnvFilePath('/srv', '../env.js'), /Invalid filename/);
  assert.throws(() => resolveEnvFilePath('/srv', 'nested/env.js'), /Invalid filename/);
});

test('writeEnvFile creates folders and overwrites with yes', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'env-inject-'));
  const filePath = path.join(dir, 'nested', 'env.js');
  try {
    assert.equal(await writeEnvFile(filePath, 'first'), true);
    assert.equal(fs.readFileSync(filePath, 'utf8'), 'first');
    assert.equal(await writeEnvFile(filePath, 'second', true), true);
    assert.equal(fs.readFileSync(filePath, 'utf8'), 'second');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
