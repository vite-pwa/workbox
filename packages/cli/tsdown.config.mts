import { defineConfig } from 'tsdown'
import {
  attw,
  workboxBanner as banner,
  publint,
} from '../../tsdown-helper'

export default defineConfig([{
  entry: './src/cli.ts',
  platform: 'node',
  target: 'node20',
  clean: true,
  dts: false,
  minify: false,
  deps: {
    onlyBundle: false,
  },
  banner,
}, {
  entry: './src/index.ts',
  platform: 'node',
  target: 'node20',
  dts: true,
  clean: false,
  publint,
  attw,
  deps: {
    onlyBundle: false,
  },
  banner,
}])
