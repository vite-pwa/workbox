import process from 'node:process'
import { it as base } from 'vitest'
import { createFixture } from './fixture-utils'
import { swCode } from './sw-code'

export const testWithSandbox = base
  .extend<{ sandbox: { root: string, dist: string } }>({
    // eslint-disable-next-line no-empty-pattern
    sandbox: async ({}, use) => {
      await createFixture(swCode, use)
    },
  })
  .skipIf(process.env.VITEST_MODE === 'WATCH')
