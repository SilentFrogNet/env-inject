import { filterEnv, getPrefixes } from './utils/filterEnv.js';
import { loadEnv } from './utils/loadEnv.js';
import {
  buildEnvJsContent,
  resolveEnvFilePath,
  writeEnvFile,
  DEFAULT_FILENAME,
  DEFAULT_GLOBAL,
  DEFAULT_OUT,
} from './utils/writeEnv.js';

export { buildEnvJsContent, filterEnv, getPrefixes };

export const injectEnv = async ({
  out = DEFAULT_OUT,
  builder = 'all',
  noPublic = false,
  prefixes = [],
  envFiles = [],
  env = process.env,
  globalName = DEFAULT_GLOBAL,
  filename = DEFAULT_FILENAME,
  yes = false,
  dryRun = false,
} = {}) => {
  const activePrefixes = getPrefixes({ builder, noPublic, prefixes });
  const vars = filterEnv(loadEnv({ envFiles, env }), activePrefixes);
  const filePath = resolveEnvFilePath(out, filename);
  const content = buildEnvJsContent(vars, globalName);
  const written = dryRun ? false : await writeEnvFile(filePath, content, yes);
  return { vars, prefixes: activePrefixes, filePath, content, written };
};
