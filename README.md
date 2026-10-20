# env-inject

A tool to inject environment variables into your project build.

Frontend builders like Vite and Create React App bake environment variables into the bundle at **build time**, so you need a separate build for every environment. `env-inject` lets you configure the app at **runtime** instead. It writes the variables you choose to an `env.js` file that your app loads before the bundle and reads from `window.env`.

You can build once and then deploy the same artifact (for example a Docker image) to dev, staging and production, with each one getting its own configuration.

## How it works

1. Reads environment variables from the current process and from a `.env` file in the working directory, if there is one. Use `--dotenv` to load other files. Variables already set in the environment take precedence over the files.
2. Keeps only variables with a public prefix, plus any you add with `--prefix`:
   - `PUBLIC_`
   - `VITE_`
   - `REACT_APP_`
3. Writes them to `<out>/env.js` (default: `./public/env.js`), sorted by name. The console output lists only variable names, never values.

   ```js
   window.env = {
     "VITE_API_URL": "https://api.example.com",
     "PUBLIC_URL": "http://localhost:3000"
   };
   ```

> [!WARNING]
> Everything written to `env.js` is served to the browser and is visible to anyone. Never put secrets in variables with these prefixes.

## Installation

Install as a dev dependency:

```sh
npm install --save-dev @silentfrog/env-inject
# or
yarn add --dev @silentfrog/env-inject
```

Or run it without installing:

```sh
npx @silentfrog/env-inject
```

Once installed, the command is available as `env-inject`.

## Usage

```
env-inject [options] [builder]
```

| Option                | Description                                                     |
| --------------------- | --------------------------------------------------------------- |
| `-o, --out <dir>`     | Destination folder for `env.js` (default: `./public`)           |
| `-y, --yes`           | Overwrite an existing `env.js` without asking                   |
| `-np, --no-public`    | Do not inject `PUBLIC_` variables                               |
| `--prefix <PREFIX>`   | Also inject variables with this prefix (repeatable)             |
| `--dotenv <path>`     | Load variables from this file instead of `.env` (repeatable)    |
| `--global <name>`     | Name of the `window` property (default: `env`)                  |
| `--filename <name>`   | Name of the generated file (default: `env.js`)                  |
| `--dry-run`           | Print the generated file instead of writing it                  |
| `-v, --version`       | Show the version number                                         |
| `-h, --help`          | Show help information                                           |

Options that take a value accept both `--out dir` and `--out=dir`.

With several `--dotenv` files, a variable takes the value from the first file that defines it. List the most specific file first, for example `--dotenv .env.production --dotenv .env`.

| Builder         | Prefixes injected                        |
| --------------- | ---------------------------------------- |
| `all` (default) | `PUBLIC_`, `VITE_`, `REACT_APP_`         |
| `vite`          | `PUBLIC_`, `VITE_`                       |
| `react-scripts` | `PUBLIC_`, `REACT_APP_`                  |

If `env.js` already exists, `env-inject` asks before overwriting it. When there is no interactive terminal, as in CI or Docker, it fails instead, so pass `-y` in those environments.

## Examples

### Basic CLI usage

```sh
# Inject all supported prefixes into ./public/env.js
env-inject

# Only VITE_ and PUBLIC_ variables, overwrite without prompting
env-inject -y vite

# Only REACT_APP_ variables, written to ./build
env-inject --no-public -o build react-scripts

# Pass variables inline
VITE_API_URL=https://api.example.com env-inject -y vite

# Load production settings, falling back to .env
env-inject -y --dotenv .env.production --dotenv .env vite

# Also inject APP_* variables, as window.__ENV__ in config.js
env-inject -y --prefix APP_ --global __ENV__ --filename config.js

# Check what would be generated without writing anything
env-inject --dry-run vite
```

### Load `env.js` in your app

Add the script to `index.html` **before** your app bundle so `window.env` is ready when the app starts.

Vite (`index.html` at the project root):

```html
<head>
  <script src="/env.js"></script>
</head>
```

Create React App (`public/index.html`):

```html
<head>
  <script src="%PUBLIC_URL%/env.js"></script>
</head>
```

Then read values from `window.env`, falling back to the build-time value:

```js
// Vite
const apiUrl = window.env?.VITE_API_URL ?? import.meta.env.VITE_API_URL;

// Create React App
const apiUrl = window.env?.REACT_APP_API_URL ?? process.env.REACT_APP_API_URL;
```

For TypeScript, the package ships a declaration for `window.env`. Reference it once, for example in `src/vite-env.d.ts`:

```ts
/// <reference types="@silentfrog/env-inject/client" />
```

If you use `--global`, declare your own property name instead.

### Generate `env.js` during local development

Use npm's `pre` scripts to refresh `public/env.js` from your `.env` file before every dev run or build:

```json
{
  "scripts": {
    "predev": "env-inject -y vite",
    "dev": "vite",
    "prebuild": "env-inject -y vite",
    "build": "vite build"
  }
}
```

With a `.env` file like:

```sh
VITE_API_URL=http://localhost:8080
PUBLIC_APP_NAME=My App
SECRET_KEY=not-injected   # no public prefix, so it is ignored
```

`env.js` is generated, so add it to `.gitignore`:

```
public/env.js
```

### Runtime configuration with Docker and nginx

Build the static app once, then generate `env.js` every time the container starts. The official nginx image runs every script in `/docker-entrypoint.d/` before it starts the server.

`Dockerfile`:

```dockerfile
# --- build stage ---
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# --- runtime stage ---
FROM nginx:alpine
RUN apk add --no-cache nodejs npm \
 && npm install -g @silentfrog/env-inject
COPY --from=build /app/dist /usr/share/nginx/html
COPY docker/40-env-inject.sh /docker-entrypoint.d/40-env-inject.sh
RUN chmod +x /docker-entrypoint.d/40-env-inject.sh
```

`docker/40-env-inject.sh`:

```sh
#!/bin/sh
set -e
env-inject -y -o /usr/share/nginx/html vite
```

Run the same image with different settings:

```sh
docker run -p 8080:80 \
  -e VITE_API_URL=https://api.staging.example.com \
  -e PUBLIC_APP_NAME="My App (staging)" \
  my-app

docker run -p 8080:80 \
  -e VITE_API_URL=https://api.example.com \
  my-app
```

Or with Docker Compose:

```yaml
services:
  web:
    image: my-app
    ports:
      - "8080:80"
    environment:
      VITE_API_URL: https://api.example.com
      PUBLIC_APP_NAME: My App
```

> [!TIP]
> Configure nginx to send `env.js` with `Cache-Control: no-store` so browsers don't keep serving an old configuration after a redeploy.

## Programmatic API

You can also call the package from a Node script (ESM only):

```js
import { injectEnv } from '@silentfrog/env-inject';

const { vars, filePath, written } = await injectEnv({
  out: './dist',
  builder: 'vite',
  yes: true,
});
console.log(`Wrote ${Object.keys(vars).length} variables to ${filePath}`);
```

`injectEnv` accepts the same settings as the CLI: `out`, `builder`, `noPublic`, `prefixes`, `envFiles`, `globalName`, `filename`, `yes` and `dryRun`. Two more options are only available here:

- `env`: the variables to filter, instead of `process.env`.
- `envFiles: false`: skip loading any env file.

It resolves to `{ vars, prefixes, filePath, content, written }`, and it throws on invalid options or a missing env file.

The lower-level helpers `getPrefixes`, `filterEnv` and `buildEnvJsContent` are exported too, and type declarations are included.

## License

MIT
