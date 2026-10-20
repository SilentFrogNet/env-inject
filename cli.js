#!/usr/bin/env node

import { createRequire } from "module";
import { processArgs } from './utils/args.js';
import { injectEnv } from './index.js';

const require = createRequire(import.meta.url);
const packageJson = require("./package.json");

// Capture user input from the CLI
const [,, ...arg] = process.argv;
let args;
try {
  args = processArgs(arg);
} catch (err) {
  console.error(err.message);
  console.error("Run env-inject --help for usage.");
  process.exit(1);
}

if (args.version) {
  console.log(`Version: ${packageJson.version}`);
  process.exit(0);
}
if (args.help) {
  console.log("Usage: env-inject [options] [builder]");
  console.log("Options:");
  console.log("  -v,  --version                     Show version number");
  console.log("  -h,  --help                        Show help information");
  console.log("  -np, --no-public                   Will not inject PUBLIC_ variables");
  console.log("  -o,  --out <dir>                   Destination folder (default: ./public)");
  console.log("  -y,  --yes                         Automatically overwrite existing env.js file");
  console.log("       --prefix <PREFIX>             Also inject variables with this prefix (repeatable)");
  console.log("       --dotenv <path>               Load variables from this file instead of .env (repeatable)");
  console.log("       --global <name>               Name of the window property (default: env)");
  console.log("       --filename <name>             Name of the generated file (default: env.js)");
  console.log("       --dry-run                     Print the generated file instead of writing it");
  console.log(" ");
  console.log("  builder: all|vite|react-scripts    Specify the builder to target (default: all)");
  process.exit(0);
}

console.log("Injecting environment variables...");

let result;
try {
  result = await injectEnv({
    out: args.out,
    builder: args.builder,
    noPublic: args.no_public,
    prefixes: args.prefixes,
    envFiles: args.env_files,
    globalName: args.global,
    filename: args.filename,
    yes: args.yes,
    dryRun: args.dry_run,
  });
} catch (err) {
  console.error(err.message);
  process.exit(1);
}

// Only log names: values end up in CI and container logs
const keys = Object.keys(result.vars);
if (keys.length === 0) {
  console.warn(`Warning: no variables matched ${result.prefixes.join(", ")}; ${args.filename} will be empty.`);
} else {
  console.log(`Found ${keys.length} variable(s): ${keys.join(", ")}`);
}

if (args.dry_run) {
  console.log(`Would write ${result.filePath}:\n`);
  process.stdout.write(result.content);
} else if (result.written) {
  console.log(`Wrote environment file to ${result.filePath}`);
} else {
  process.exit(1);
}
