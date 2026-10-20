import fs from 'fs';
import path from 'path';
import readline from 'readline';

export const buildEnvJsContent = (vars) => {
  return `window.env = ${JSON.stringify(vars, null, 2)};\n`;
};

export const writeEnvFile = async (outDir, vars, yes=false) => {
  const publicDir = path.resolve(process.cwd(), outDir || './public');
  const filePath = path.join(publicDir, 'env.js');

  try {
    fs.mkdirSync(publicDir, { recursive: true });
  } catch (err) {
    console.error('Failed to create public directory:', err);
    return false;
  }

  const write = () => {
    const contents = buildEnvJsContent(vars);
    try {
      fs.writeFileSync(filePath, contents, 'utf8');
      console.log(`Wrote environment file to ${filePath}`);
      return true;
    } catch (err) {
      console.error('Failed to write env file:', err);
      return false;
    }
  };

  if (!yes &&fs.existsSync(filePath)) {
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
    console.log('Aborted. env.js not overwritten.');
    return false;
  }
  return write();
};
