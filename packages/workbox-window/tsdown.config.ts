import { defineConfig } from 'tsdown'
import { banner, define } from '../../helper.ts'

export default defineConfig({
  entry: './src/index.ts',
  platform: 'browser',
  banner,
  define,
})
