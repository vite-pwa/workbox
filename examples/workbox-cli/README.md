# workbox-cli example

Demonstrates `@vite-pwa/workbox-build` two ways:

- **Programmatically** - calling the build API directly from a script (`*.ts` runners via `tsx`).
- **Via the CLI** - `workbox-cli`, driven by `*.config.ts` files.

## Setup

From the repo root:

```bash
pnpm install
```

This links the `workbox-cli` bin and resolves the `defineCliOptions` import used by the config files. Run scripts with `pnpm --filter workbox-build-cli run <script>` (or `cd` into this folder and `pnpm run <script>`).

## Programmatic API (`tsx`)

| Script | Strategy | What it does |
| --- | --- | --- |
| `generate` | `generateSW` | Generate a complete service worker. |
| `build` | `buildSW` | Bundle a source service worker and inject the precache manifest. |
| `build-split` | `buildSW` | Same, with chunk splitting. |
| `inject` | `injectManifest` | Inject the manifest into an existing SW (`custom-sw.js`). |
| `manifest` | `getManifest` | Compute and print the precache manifest only. |

## CLI (`workbox-cli`)

| Script | Config | Strategy |
| --- | --- | --- |
| `cli` | `workbox.config.ts` (auto-discovered) | `generate-sw` **+ self-destroy add-on** |
| `cli:generate` | `generate-sw.config.ts` | `generate-sw` |
| `cli:build-sw` | `build-sw.config.ts` | `build-sw` |
| `cli:inject` | `inject-manifest.config.ts` | `inject-manifest` |
| `cli:manifest` | `manifest.config.ts` | `get-manifest` |
| `cli:self-destroy` | `workbox.config.ts` (`-c` override) | `self-destroy-sw` (standalone) |

The CLI also supports:

- `-i, --interactive` - choose the strategy from a prompt.
- `-c, --command <strategy>` - run a specific strategy from the config.
- `-s, --self-destroy` - also emit a self-destroying SW after a build strategy.

## Self-destroying service worker

A self-destroying SW unregisters itself and clears caches on activation - useful to remove a previously shipped SW from clients. There are three ways to produce one:

1. **Config add-on** - set `selfDestroying: { selfDestroying: true, swDest: 'sw-destroy.js' }` alongside a build strategy (see [`workbox.config.ts`](./workbox.config.ts)). After the main SW is built, an extra self-destroying SW is written. Run: `pnpm run cli`.
2. **CLI flag** - pass `-s` to a build strategy when `selfDestroying.swDest` is configured.
3. **Standalone strategy** - `workbox-cli -c self-destroy-sw` writes only the self-destroying SW. Run: `pnpm run cli:self-destroy`.

> The add-on attaches only to SW-building strategies (`generate-sw`, `build-sw`, `inject-manifest`) - not to `get-manifest`, which is read-only. Keep `selfDestroying.swDest` different from the main `swDest` so the add-on doesn't overwrite the SW you just built.

Generated output (`sw*.js`, `workbox-*.js`, `dist/`, `custom-build/sw-*.js`) is git-ignored.
