# Contributing Guide

Hi! We are really excited that you are interested in contributing to `@vite-pwa/workbox`. Before submitting your contribution, please make sure to take a moment and read through the following guide.

Refer also to https://github.com/antfu/contribute.

## Set up your local development environment

The `@vite-pwa/workbox` repo is a monorepo using pnpm workspaces. The package manager used to install and link dependencies must be [pnpm](https://pnpm.io/).

To develop and test the `@vite-pwa/workbox` package:

1. Fork the `@vite-pwa/workbox` repository to your own GitHub account and then clone it to your local device.

2. Ensure using the latest Node.js (22.x/24.x).

3. `@vite-pwa/workbox` uses pnpm. If you are working on multiple projects with different versions of pnpm, it's recommend to enable [Corepack](https://github.com/nodejs/corepack) by running `corepack enable`.

4. Check out a branch where you can work and commit your changes:
```shell
git checkout -b my-new-branch
```

5. Run `pnpm install --frozen-lockfile` in `@vite-pwa/workbox`'s root folder

6. Run `nr build` in `@vite-pwa/workbox`'s root folder.
