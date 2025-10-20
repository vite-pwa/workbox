import type { ProxifiedModule, ProxifiedObject } from 'magicast'
import type { GenerateSWOptions } from './types'
import { generateCode, parseModule } from 'magicast'
import { getDefaultExportOptions } from 'magicast/helpers'
import { GenerateSWOptionsSchema } from './validation/generate-sw'
import { validate } from './validation/validation-helper'

export async function generateSW(
  options: ProxifiedModule<GenerateSWOptions>,
): Promise<void> {
  const config = getDefaultExportOptions(options) as ProxifiedObject<GenerateSWOptions>
  console.log(config.swDest)
  console.log(generateCode(config).code)
  validate(
    GenerateSWOptionsSchema,
    config,
    'generateSW',
  )
  // ensureValidNavigationPreloadConfig(config)
  // ensureValidCacheExpiration(config)
  // ensureValidRuntimeCachingOrGlobDirectory(config)
}

async function main() {
  const module = parseModule<GenerateSWOptions>(`export default {
  swDest: 'sw.js',
  runtimeCaching: [
    {
      urlPattern: /.*!/,
      handler: 'NetworkFirst',
    },
  ],
}
`)
  await generateSW(module)
}

main()
