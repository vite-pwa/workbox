import { fileURLToPath } from 'node:url'
import { defineConfig } from 'tsdown'
import {
  attw,
  workboxBanner as banner,
  cleanupJSTypes,
  fixTypesVersion,
  publint,
} from '../../tsdown-helper'

const cwd = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  entry: [
    './src/{index,types,generate-sw,get-manifest,inject-manifest,self-destroying-sw}.ts',
    './src/utils/resolve-sw-names.ts',
    {
      'build/*': [
        './src/build/*.ts',
        '!./src/build/generate-sw.ts',
      ],
      'build/vite/*': [
        './src/build/vite/*.ts',
        '!./src/build/vite/build-context.ts',
        '!./src/build/vite/build-utils.ts',
        '!./src/build/vite/internal-types.ts',
      ],
      'build/vite/plugin/*': [
        './src/build/vite/plugin/*.ts',
        '!./src/build/vite/plugin/plugin-*.ts',
      ],
      'build/rolldown/*': [
        './src/build/rolldown/*.ts',
        '!./src/build/rolldown/build-context.ts',
        '!./src/build/rolldown/build-utils.ts',
        '!./src/build/rolldown/generate-manifest.ts',
        '!./src/build/rolldown/internal-types.ts',
      ],
    },
    {
      'config/*': [
        './src/config/*.ts',
        '!./src/config/load-configuration.ts',
      ],
    },
    {
      'build/rspack/*': [
        './src/build/rspack/*.ts',
      ],
      'build/webpack/*': [
        './src/build/webpack/*.ts',
      ],
    },
  ],
  platform: 'node',
  clean: true,
  banner,
  outputOptions: {
    comments: {
      jsdoc: false,
      legal: false,
      annotation: false,
    },
  },
  attw,
  publint,
  deps: {
    neverBundle: [
      '@rspack/core',
      'magicast',
      'rolldown',
      'webpack',
      'rolldown',
      'vite',
    ],
  },
  exports: fixTypesVersion,
  hooks: {
    'build:done': async () => {
      await cleanupJSTypes(cwd)
    },
  },
})
