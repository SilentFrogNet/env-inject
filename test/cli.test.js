import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const CLI = fileURLToPath(new URL('../cli.js', import.meta.url));
let dir;

// Runs the CLI in the temp dir with a clean environment and piped (non-TTY) stdin
const run = (args, env = {}) => spawnSync(process.execPath, [CLI, ...args], {
  cwd: dir,
  env: { PATH: process.env.PATH, ...env },
  input: '',
  encoding: 'utf8',
});

before(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'env-inject-cli-'));
  fs.writeFileSync(path.join(dir, '.env'), 'VITE_URL=from-dotenv\nPUBLIC_NAME=app\nREACT_APP_X=x\nSECRET=s\n');
});

after(() => fs.rmSync(dir, { recursive: true, force: true }));

test('writes public/env.js and logs only variable names', () => {
  const res = run(['-y', 'vite'], { VITE_URL: 'from-env' });
  assert.equal(res.status, 0, res.stderr);
  assert.match(res.stdout, /PUBLIC_NAME, VITE_URL/);
  assert.doesNotMatch(res.stdout, /from-env/);

  const content = fs.readFileSync(path.join(dir, 'public', 'env.js'), 'utf8');
  assert.equal(content, 'window.env = {\n  "PUBLIC_NAME": "app",\n  "VITE_URL": "from-env"\n};\n');
});

test('refuses to overwrite without --yes when stdin is not a TTY', () => {
  run(['-y']);
  const res = run([]);
  assert.equal(res.status, 1);
  assert.match(res.stderr, /use --yes to overwrite/);
});

test('--dry-run prints the file without writing it', () => {
  const res = run(['--dry-run', '--global', '__ENV__', '--filename', 'config.js', '--prefix', 'SECRET']);
  assert.equal(res.status, 0, res.stderr);
  assert.match(res.stdout, /window\.__ENV__ = \{/);
  assert.match(res.stdout, /"SECRET": "s"/);
  assert.equal(fs.existsSync(path.join(dir, 'public', 'config.js')), false);
});

test('warns when no variables match', () => {
  fs.writeFileSync(path.join(dir, 'empty.env'), 'SECRET=s\n');
  const res = run(['--dry-run', '--dotenv', 'empty.env']);
  assert.equal(res.status, 0, res.stderr);
  assert.match(res.stderr, /no variables matched/);
});

test('exits with an error for bad input', () => {
  assert.equal(run(['--bogus']).status, 1);
  assert.match(run(['--dotenv', 'missing.env']).stderr, /Env file not found/);
  assert.match(run(['--global', 'a-b']).stderr, /Invalid global name/);
});
