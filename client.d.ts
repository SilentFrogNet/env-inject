// Declares window.env for browser code that loads the generated env.js.
// Use with: /// <reference types="@silentfrog/env-inject/client" />
interface Window {
  env?: Record<string, string | undefined>;
}
