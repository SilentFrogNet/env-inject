const BUILDERS = ["all", "vite", "react-scripts"];

// Options that take a value: the key they set and how the value is described in errors.
// Keys holding an array are repeatable.
const VALUE_OPTIONS = {
  "--out": { key: "out", label: "a directory" },
  "-o": { key: "out", label: "a directory" },
  "--prefix": { key: "prefixes", label: "a prefix" },
  "--dotenv": { key: "env_files", label: "a file path" },
  "--global": { key: "global", label: "a name" },
  "--filename": { key: "filename", label: "a file name" },
};

export const processArgs = (args = []) => {
  if (args.includes("--help") || args.includes("-h")) {
    return { help: true };
  }
  if (args.includes("--version") || args.includes("-v")) {
    return { version: true };
  }

  let out = {
    no_public: false,
    yes: false,
    dry_run: false,
    out: "./public",
    builder: "all",
    prefixes: [],
    env_files: [],
    global: "env",
    filename: "env.js",
  };
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    // "--out=dir" form: split the value from the name
    const eq = arg.startsWith("-") ? arg.indexOf("=") : -1;
    const name = eq === -1 ? arg : arg.slice(0, eq);
    const option = VALUE_OPTIONS[name];

    if (option) {
      // "-o dir" form: the value is the next argument
      const value = eq === -1 ? args[++i] : arg.slice(eq + 1);
      if (!value) throw new Error(`${name} requires ${option.label}`);
      if (Array.isArray(out[option.key])) {
        out[option.key].push(value);
      } else {
        out[option.key] = value;
      }
    } else if (arg === "--no-public" || arg === "-np") {
      out.no_public = true;
    } else if (arg === "--yes" || arg === "-y") {
      out.yes = true;
    } else if (arg === "--dry-run") {
      out.dry_run = true;
    } else if (BUILDERS.includes(arg)) {
      out.builder = arg;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return out;
}
