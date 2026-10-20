#!/usr/bin/env node

import 'dotenv/config';
import { createRequire } from "module";
import { processArgs } from './utils/args.js';
import { writeEnvFile } from './utils/writeEnv.js';

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
  console.log(" ");
  console.log("  builder: all|vite|react-scripts    Specify the builder to target (default: all)");
  process.exit(0);
}

console.log("Injecting environment variables...");

let varsToInclude = ["PUBLIC_", "VITE_", "REACT_APP_"];
if (args.no_public) {
  varsToInclude = varsToInclude.filter(prefix => prefix !== "PUBLIC_");
}
if (args.builder === "vite") {
  varsToInclude = varsToInclude.filter(prefix => prefix !== "REACT_APP_");
} else if (args.builder === "react-scripts") {
  varsToInclude = varsToInclude.filter(prefix => prefix !== "VITE_");
}

const filteredEnvVars = Object.keys(process.env)
  .filter(key => varsToInclude.some(prefix => key.startsWith(prefix)))
  .reduce((obj, key) => {
    obj[key] = process.env[key];
    return obj;
  }, {});

console.log(filteredEnvVars);

if (!(await writeEnvFile(args.out, filteredEnvVars, args.yes))) {
  process.exit(1);
}
