import antfu from '@antfu/eslint-config'

export default antfu({
  ignores: [
    '**/dist/**',
    '**/dev-dist/**',
    'examples/workbox-cli/custom-sw*.js',
    'examples/workbox-cli/esm-sw*.js',
    'examples/workbox-cli/classic-sw*.js',
    'examples/workbox-cli/sw*.js',
    'examples/workbox-cli/workbox.js',
    'examples/workbox-cli/workbox*.js',
    'pnpm-workspace.yaml',
  ],
}, {
  files: ['**/sw.ts', '**/*.sw.ts'],
  rules: {
    'no-console': 'off',
    'no-restricted-globals': 'off',
  },
}, {
  // it detects nested arrays wrongly
  files: ['.github/labeler.yml'],
  rules: {
    'yaml/indent': 'off',
  },
})
