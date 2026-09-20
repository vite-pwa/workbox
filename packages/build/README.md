<br>

<p align='center'>
    <img src='https://github.com/vite-pwa/workbox/blob/main/workbox.svg' alt="Vite PWA workbox">
</p>

<h1 align="center">Vite PWA Workbox Build</h1>

<p align='center'>
<a href='https://npmx.dev/package/@vite-pwa/workbox-build' target="__blank">
<img src='https://img.shields.io/npm/v/@vite-pwa/workbox-build?color=33A6B8&label=' alt="NPM version">
</a>
<a href="https://npmx.dev/package/@vite-pwa/workbox-build" target="__blank">
    <img alt="NPM Downloads" src="https://img.shields.io/npm/dm/@vite-pwa/workbox-build?color=476582&label=">
</a>
</p>

## 🛠️ Welcome to Vite PWA Workbox Build

The modern toolkit for modern web apps. **Vite PWA Workbox Build** provides the essential, ESM-powered JavaScript libraries you need to build rock-solid, offline-ready [Progressive Web Apps](https://web.dev/progressive-web-apps/).

## Requirements

`@vite-pwa/workbox-build` requires **Node 22.14.0 or above**.

You need to install the following dependencies to run `@vite-pwa/workbox-build`:
- Rolldown 1.0.0 or above: if you've installed Vite 8 or above, you don't need to install Rolldown as a dependency, because Vite 8 uses Rolldown; you need to install Rolldown when using Webpack, Rspack or Rsbuild
- `magicast` 0.5.0 or above: when using `generateSW` strategy only

## Breaking Changes

The following breaking changes were introduced in the packages:
- `injectManifest` strategy doesn't build your service worker, `@vite-pwa/workbox-build` just injects the manifest into your service worker
- removed service worker templates: consumer should use a custom service worker instead (using ESM notation)
- removed offline Google Analytics support

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

## 📄 License

[MIT](./LICENSE) License &copy; 2026-PRESENT [Anthony Fu](https://github.com/antfu)