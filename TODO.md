## TODO

- review workbox-sw package, maybe we need to move it to commonjs?

## Pending task

- add release-commit.yml from Kevin workflows
- release initial version from local, then use Kevin workflow (Trusted Publisher + Provenance)
- add missing workbox-* packages
- add tests: migrate workbox tests to vitest and playwright/webdriverio (I need to check service worker support)
- review jsdocs: tsdown is able to add the jsdocs also to js files, maybe we can add some jsdocs to the docs
- try tsdown experimental monorepo support (Kevin can help us)
- migrate to vite+
- add readme file: prepare svg at figma
- review workbox-build::generateSW: we should use magicast and make pwa options statically analisable, we should be able to use tsdown/rolldown directly to build the service worker, check svg-packer package (maybe we need esbuild)
