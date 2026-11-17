import { defineConfig } from 'taze'

export default defineConfig({
  recursive: true,
  write: true,
  maturityPeriod: 7,
  peer: false,
  mode: 'minor',
  exclude: [
    'taze',
    'dotenv-expand',
    'node',
    // unpin rolldown once Vite 8.4 released
    'rolldown',
    'rolldown-legacy',
    'why-is-node-running',
  ],
  githubActions: {
    style: 'sha',
  },
  depFields: {
    packageManager: false,
  },
})
