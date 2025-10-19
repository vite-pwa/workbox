import { defineConfig } from 'vitest/config'
import { alias } from './alias'

export default defineConfig({
  optimizeDeps: {
    entries: [],
  },
  resolve: {
    alias,
  },
  test: {
    globals: true,
    environment: 'node',
    testTimeout: 30_000,
    name: 'unit',
  },
})
