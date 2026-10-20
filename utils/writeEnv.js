import fs from 'fs';
import path from 'path';
import readline from 'readline';

export const DEFAULT_OUT = './public';
export const DEFAULT_FILENAME = 'env.js';
export const DEFAULT_GLOBAL = 'env';

const IDENTIFIER = /^[A-Za-z_$][\w$]*$/;

export const buildEnvJsContent = (vars, globalName = DEFAULT_GLOBAL) => {
  if (!IDENTIFIER.test(globalName)) {
    throw new Error(`Invalid global name: ${globalName}`);
  }
  return `window.${globalName} = ${JSON.stringify(vars, null, 2)};\n`;
};

export const resolveEnvFilePath = (outDir = DEFAULT_OUT, filename = DEFAULT_FILENAME) => {
  if (!filename || filename === '.' || filename === '..' || path.basename(filename) !== filename) {
    throw new Error(`Invalid filename: ${filename} (use --out to change the folder)`);
  }
  return path.join(path.resolve(process.cwd(), outDir || DEFAULT_OUT), filename);
};

// Writes the file, asking before overwriting unless `yes` is set. Returns true when written.
export const writeEnvFile = async (filePath, contents, yes = false) => {
  try {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
  } catch (err) {
    console.error('Failed to create output directory:', err);
    return false;
  }

  const write = () => {
    try {
      fs.writeFileSync(filePath, contents, 'utf8');
      return true;
    } catch (err) {
      console.error('Failed to write env file:', err);
      return false;
    }
  };

  if (!yes && fs.existsSync(filePath)) {
    if (!process.stdin.isTTY) {
      console.error(`${filePath} exists and stdin is not a TTY; use --yes to overwrite.`);
      return false;
    }

    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const answer = await new Promise(resolve => {
      rl.question(`${filePath} already exists. Overwrite? (y/N) `, ans => {
        rl.close();
        resolve(ans.trim().toLowerCase());
      });
    });

    if (answer === 'y' || answer === 'yes') {
      return write();
    }
    console.log(`Aborted. ${path.basename(filePath)} not overwritten.`);
    return false;
  }
  return write();
};
