export const processArgs = (args) => {
  if (args) {
    if (args.includes("--help") || args.includes("-h")) {
      return {
        version: false,
        help: true
      }
    } else if (args.includes("--version") || args.includes("-v")) {
      return {
        version: true,
        help: false
      }
    } else {
      let out = {
        no_public: false,
        yes: false,
        out: "./public",
        builder: "all"
      };
      args.forEach(arg => {
        if (arg === "--no-public" || arg === "-np") {
          out.no_public = true;
        }
        if (arg === "--yes" || arg === "-y") {
          out.yes = true;
        }
        if (arg ==="all" || arg === "vite" || arg === "react-scripts") {
          out.builder = arg;
        }
        if (arg.startsWith("--out=") || arg.startsWith("-o=")) {
          const [ , value ] = arg.split("=");
          out.out = value;
        }
      });
      return out;
    }
  } else {
    return {};
  }
}
