export type Builder = "all" | "vite" | "react-scripts";

export interface InjectEnvOptions {
  /** Destination folder (default: "./public") */
  out?: string;
  /** Builder to target (default: "all") */
  builder?: Builder;
  /** Do not inject PUBLIC_ variables */
  noPublic?: boolean;
  /** Extra prefixes to inject */
  prefixes?: string[];
  /** Env files to load instead of ./.env; false skips loading files */
  envFiles?: string[] | false;
  /** Variables to filter (default: process.env) */
  env?: Record<string, string | undefined>;
  /** Name of the window property (default: "env") */
  globalName?: string;
  /** Name of the generated file (default: "env.js") */
  filename?: string;
  /** Overwrite an existing file without asking */
  yes?: boolean;
  /** Build the content without writing the file */
  dryRun?: boolean;
}

export interface InjectEnvResult {
  vars: Record<string, string>;
  prefixes: string[];
  filePath: string;
  content: string;
  written: boolean;
}

export function injectEnv(options?: InjectEnvOptions): Promise<InjectEnvResult>;

export function getPrefixes(options?: {
  builder?: Builder;
  noPublic?: boolean;
  prefixes?: string[];
}): string[];

export function filterEnv(
  env: Record<string, string | undefined>,
  prefixes: string[]
): Record<string, string>;

export function buildEnvJsContent(vars: Record<string, string>, globalName?: string): string;
