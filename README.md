<br>

<p align='center'>
    <img src='https://github.com/vite-pwa/workbox/blob/main/workbox.svg' alt="Vite PWA workbox">
</p>

<h1 align="center">Vite PWA Workbox</h1>

## Welcome to the Vite PWA Workbox repository!

Vite PWA Workbox is a collection of JavaScript libraries for [Progressive Web Apps](https://web.dev/progressive-web-apps/).

## Requirements

`@vite-pwa/workbox-build` and `@vite-pwa/workbox-cli` require **Node 22.14.0 or above**.

You need to install the following dependencies to run `@vite-pwa/workbox-cli` or use `@vite-pwa/workbox-build`:
- Rolldown 1.0.0 or above: if you've installed Vite 8 or above, you don't need to install Rolldown as a dependency, because Vite 8 uses Rolldown
- `magicstring` 0.5.0 or above: when using `generateSW` strategy only

## Breaking Changes

`injectManifest` strategy doesn't build your service worker, `@vite-pwa/workbox-build` just injects the manifest into your service worker.

## New features

`@vite-pwa/workbox-build` adds these new features:
- `buildSW` strategy: builds your service worker and injects the manifest into it when
- dual service worker generation, with  `generateSW` and `buildSW` strategies: use `swType` option.
- dot `env` files support: `.env`, `.env.local`, `.env.[mode]`, `.env.[mode].local` files are supported.
- custom Rolldown/Vite plugins
- custom logs level configuration
- minify the service worker build, including comments (Rolldown options)
- custom code splitting chunks: now it is possible to split your service worker code into multiple chunks, not just `workbox` service worker modules
- new `additionalManifestEntriesGenerator` to allow use async generators to allow to defer the manifest entries generation (read and calculate revision) until required
- `generateSW` strategy supports configuring `parallel` option to allow precaching in parallel, instead of sequentially
- `generateSW` strategy supports configuring `urlManipulation` option

`@vite-pwa/workbox-swkit/precaching` package adds these new features:
- new `parallel` option to allow precaching in parallel, instead of sequentially