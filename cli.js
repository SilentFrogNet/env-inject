#!/usr/bin/env node

import 'dotenv/config';
import { createRequire } from "module";
import { processArgs } from './utils/args.js';
import { writeEnvFile } from './utils/writeEnv.js';

const require = createRequire(import.meta.url);
const packageJson = require("./package.json");

// Capture user input from the CLI
const [,, ...arg] = process.argv;
const args = processArgs(arg, ["--no-public", "all", "vite", "react-scripts"]);

if (args.version) {
  console.log(`Version: ${packageJson.version}`);
} else if (args.help) {
  console.log("Usage: env-inject [options] [builder]");
  console.log("Options:");
  console.log("  -v,  --version                     Show version number");
  console.log("  -h,  --help                        Show help information");
  console.log("  -np, --no-public                   Will not inject PUBLIC_ variables");
  console.log("  -o,  --out                         Destination folder (default: ./public)");
  console.log("  -y,  --yes                         Automatically overwrite existing env.js file");
  console.log(" ");
  console.log("  builder: all|vite|react-scripts    Specify the builder to target (default: all)");
}

console.log("Injecting environment variables...");

const envVars = {
  ...process.env,
  ...import.meta.env,
};

let varsToInclude = ["PUBLIC_", "VITE_", "REACT_APP_"];
if (args.no_public) {
  varsToInclude = varsToInclude.filter(prefix => prefix !== "PUBLIC_");
}
if (args.builder === "vite") {
  varsToInclude = varsToInclude.filter(prefix => prefix !== "REACT_APP_");
} else if (args.builder === "react-scripts") {
  varsToInclude = varsToInclude.filter(prefix => prefix !== "VITE_");
}

const filteredEnvVars = Object.keys(envVars)
  .filter(key => varsToInclude.some(prefix => key.startsWith(prefix)))
  .reduce((obj, key) => {
    obj[key] = envVars[key];
    return obj;
  }, {})

console.log(filteredEnvVars);

// Write env file using the util
(async () => {
  await writeEnvFile(args.out, filteredEnvVars, args.yes);
})();

