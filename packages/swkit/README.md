<br>

<h1 align="center">Vite PWA Workbox SWKIT</h1>

<p align='center'>
<a href='https://npmx.dev/package/@vite-pwa/workbox-swkit' target="__blank">
<img src='https://img.shields.io/npm/v/@vite-pwa/workbox-swkit?color=33A6B8&label=' alt="NPM version">
</a>
<a href="https://npmx.dev/package/@vite-pwa/workbox-swkit" target="__blank">
    <img alt="NPM Downloads" src="https://img.shields.io/npm/dm/@vite-pwa/workbox-swkit?color=476582&label=">
</a>
</p>

## 🛠️ Welcome to Vite PWA Workbox SWKIT

The modern toolkit for your service worker. **Vite PWA Workbox SWKIT** provides a consolidated, ESM-powered collection of JavaScript libraries to construct powerful, offline-first [Progressive Web Apps](https://web.dev/progressive-web-apps/) right inside your service worker context.

## New features

`@vite-pwa/workbox-swkit` introduces a major architectural shift alongside new capabilities:
- **Consolidated Architecture**: Everything that was previously scattered across multiple independent packages is now unified into this single package using subpackage exports
- **Barrel Export**: It exports a main barrel file containing all APIs. **Important:** This is designed to be exclusively processed by `@vite-pwa/workbox-build` or `@vite-pwa/workbox-cli`. Their internal engines (Vite/Rolldown) handle the aggressive tree-shaking for your service worker. Consuming this barrel directly with your own application bundler is not supported
- **Dual Build Orchestration**: When dual service workers are enabled (classic and ESM), the `@vite-pwa/workbox-build` engine compiles both builds independently and in parallel
- `@vite-pwa/workbox-swkit/precaching` adds a new `parallel` option to allow precaching in parallel, instead of sequentially

## 📄 License

[MIT](./LICENSE) License &copy; 2026-PRESENT [Anthony Fu](https://github.com/antfu)