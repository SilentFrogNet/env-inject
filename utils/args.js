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
    out: "./public",
    builder: "all"
  };
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--no-public" || arg === "-np") {
      out.no_public = true;
    } else if (arg === "--yes" || arg === "-y") {
      out.yes = true;
    } else if (arg === "all" || arg === "vite" || arg === "react-scripts") {
      out.builder = arg;
    } else if (arg === "--out" || arg === "-o") {
      // "-o /dir" form: the value is the next argument
      out.out = args[++i];
      if (!out.out) throw new Error(`${arg} requires a directory`);
    } else if (arg.startsWith("--out=") || arg.startsWith("-o=")) {
      out.out = arg.slice(arg.indexOf("=") + 1);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return out;
}
