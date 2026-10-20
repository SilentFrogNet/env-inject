import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

export const DEFAULT_ENV_FILES = ['.env'];

// Returns a copy of `env` with the variables from the env files added.
// Variables already in `env` win over the files, and earlier files win over later ones.
// With no envFiles, ./.env is loaded if it exists; envFiles=false skips loading entirely.
export const loadEnv = ({ envFiles = [], env = process.env } = {}) => {
  const merged = { ...env };
  if (envFiles === false) {
    return merged;
  }

  const explicit = envFiles.length > 0;
  const files = (explicit ? envFiles : DEFAULT_ENV_FILES).map(file => path.resolve(process.cwd(), file));
  const existing = files.filter(file => fs.existsSync(file));

  if (explicit && existing.length < files.length) {
    const missing = files.filter(file => !existing.includes(file));
    throw new Error(`Env file not found: ${missing.join(', ')}`);
  }

  if (existing.length > 0) {
    dotenv.config({ path: existing, processEnv: merged, quiet: true });
  }
  return merged;
};
