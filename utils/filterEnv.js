// Prefixes injected for each builder, on top of PUBLIC_ (unless disabled)
export const BUILDER_PREFIXES = {
  all: ["VITE_", "REACT_APP_"],
  vite: ["VITE_"],
  "react-scripts": ["REACT_APP_"],
};

export const getPrefixes = ({ builder = "all", noPublic = false, prefixes = [] } = {}) => {
  const builderPrefixes = BUILDER_PREFIXES[builder];
  if (!builderPrefixes) {
    throw new Error(`Unknown builder: ${builder}`);
  }
  return [...new Set([...(noPublic ? [] : ["PUBLIC_"]), ...builderPrefixes, ...prefixes])];
};

// Keeps only the variables whose name starts with one of the prefixes, sorted by name
export const filterEnv = (env, prefixes) => {
  return Object.fromEntries(
    Object.entries(env)
      .filter(([key, value]) => value !== undefined && prefixes.some(prefix => key.startsWith(prefix)))
      .sort(([a], [b]) => a.localeCompare(b))
  );
};
