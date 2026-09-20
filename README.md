<br>

<p align='center'>
    <img src='https://github.com/vite-pwa/workbox/blob/main/workbox.svg' alt="Vite PWA workbox">
</p>

<h1 align="center">Vite PWA Workbox</h1>

<p align='center'>
<a href="https://github.com/vite-pwa/workbox" target="__blank">
<img alt="GitHub stars" src="https://img.shields.io/github/stars/vite-pwa/workbox?style=social">
</a>
</p>

## Welcome to the Vite PWA Workbox repository!

Vite PWA Workbox is a collection of JavaScript libraries for [Progressive Web Apps](https://web.dev/progressive-web-apps/).

## Requirements

`@vite-pwa/workbox-build` and `@vite-pwa/workbox-cli` require **Node 22.14.0 or above**.

You need to install the following dependencies to run `@vite-pwa/workbox-cli` or use `@vite-pwa/workbox-build`:
- Rolldown 1.0.0 or above: if you've installed Vite 8 or above, you don't need to install Rolldown as a dependency, because Vite 8 uses Rolldown; you need to install Rolldown when using Webpack, Rspack or Rsbuild
- `magicstring` 0.5.0 or above: when using `generateSW` strategy only

## Breaking Changes

The following breaking changes were introduced in the packages:
- `injectManifest` strategy doesn't build your service worker, `@vite-pwa/workbox-build` just injects the manifest into your service worker
- removed service worker templates: consumer should use a custom service worker instead (using ESM notation)
- removed offline Google Analytics support
- `workbox-sw` not yet available (missing CDN distribution)

## New features

`@vite-pwa/workbox-build` adds these new features:
- `buildSW` strategy: builds your service worker and injects the manifest into it when enabled
- dual service worker generation, with  `generateSW` and `buildSW` strategies: use `swType` option
- dot `env` files support: `.env`, `.env.local`, `.env.[mode]`, `.env.[mode].local` files are supported
- custom Rolldown/Vite plugins
- custom logs level configuration
- minify the service worker build, including comments (Rolldown options)
- custom code splitting chunks: now it is possible to split your service worker code into multiple chunks, not just `workbox` service worker modules
- new `additionalManifestEntriesGenerator` factory to allow use async generators to allow to defer the manifest entries generation (read and calculate revision) until required
- `generateSW` strategy supports configuring `parallel` option to allow precaching in parallel, instead of sequentially
- `generateSW` strategy supports configuring `urlManipulation` option
- build plugins for Vite, Webpack, Rspack and Rsbuild

`@vite-pwa/workbox-swkit/precaching` package adds these new features:
- new `parallel` option to allow precaching in parallel, instead of sequentially

`@vite-pwa/workbox-window` package adds these new features:
- exported a new `esm-sw-detector` subpackage export to allow to detect ESM service worker support in the browser: based on [caniuse](https://caniuse.com/?search=service+worker) baseline specifications

## The Modernized Workbox Fork (Powered by Rolldown Everywhere)

The legacy Workbox build system was designed in a different era of the web. By forking and rewriting its core internals, we've gotten rid of massive amounts of technical debt (like `magicast` manipulations and complex configuration layers).

* **Native Bundler Performance**: The new `buildSW` engine hooks directly into Vite 8 or Rolldown 1's native dependency graphs.
* **Service Worker Code-Splitting Support**: While the current `vite-plugin-pwa` forces the Service Worker to be built as a single monolith, the new version introduces full code-splitting support. The new engine checks if `inlineWorkboxRuntime` is disabled; if so, it automatically breaks down the monolith, computes the resulting dependency graphs, tracks internal synchronous imports, and guarantees that chunks are correctly structured and resolved whenever a Classic Service Worker build is targeted (either as a standalone choice or as part of the Dual Build strategy).
* **Advanced Custom Chunks & Visual Graphing (Experimental)**: Alongside standard code-splitting, we are introducing highly experimental support for user-defined `customChunks` via granular configuration callbacks. The engine will dynamically map these custom allocations, resolve complex internal dependencies, and orchestrate them seamlessly. To guarantee total safety, the engine features a built-in contention layer that blocks deployment errors (such as preventing a Service Worker or its internal synchronous runtime dependencies from accidentally precaching themselves) and intercepts circular graph conflicts before they can pollute your production environments.
* **Next-Gen ESM Service Worker Support**: Since 2026, all major browsers natively support Service Worker registration with `{ type: 'module' }`. The new `buildSW` engine embraces this fully, offering native ESM Service Worker generation alongside an automated **Dual Build strategy**—allowing you to compile a modern ESM Service Worker and a legacy Classic Service Worker simultaneously from the same source. **Note that this strategy requires your source code to be written using strict ESM syntax (`import`/`export`)**; the engine will then automatically handle the down-leveling and inject the required internal orchestration whenever the Classic asset target is compiled.
* **Automatic Feature Detection**: We are introducing `@vite-pwa/workbox-window`, which exposes a lightweight `esm-sw-detector` runtime utility based on verified [CanIUse](https://caniuse.com/?search=service+worker) baseline specifications. This module determines browser capabilities on the fly to orchestrate modern asset loading.
* **Bundler Agnostic Future**: The separation of concerns makes the core engine completely agnostic. We will expose dedicated standalone plugins for **Webpack** and **Rspack** via `unplugin`. At the `buildEnd` phase of those bundlers, the plugin will seamlessly invoke **Rolldown internally** to bundle, resolve, and generate the final Service Worker.

## 📄 License

[MIT](./LICENSE) License &copy; 2026-PRESENT [Anthony Fu](https://github.com/antfu)