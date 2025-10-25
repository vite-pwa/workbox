import { defineConfig } from 'tsdown'
import { banner, exports } from '../../helper.ts'

export default defineConfig({
  entry: './src/{index,types,generate-sw,get-manifest,inject-manifest}.ts',
  platform: 'node',
  banner,
  exports,
})
