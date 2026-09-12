import { defaultExclude, defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    name: 'workbox-cli',
    environment: 'node',
    include: ['test/*.spec.ts'],
    exclude: ['test/fixtures/**', ...defaultExclude],
  },
})
