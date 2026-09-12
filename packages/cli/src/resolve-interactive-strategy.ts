import type { SWType } from '@vite-pwa/workbox-build/types'
import type { CliStrategy, StrategyName, WorkboxCliConfig } from './options'
import process from 'node:process'
import { hasTTY, isCI } from 'std-env'
import { STRATEGY_META, STRATEGY_NAMES } from './options'

export async function resolveInteractiveStrategy(
  config: WorkboxCliConfig<CliStrategy, SWType>,
): Promise<StrategyName> {
  if (!hasTTY || isCI)
    throw new Error('--interactive requires a TTY (not available in CI)')

  const { isCancel, cancel, select } = await import('@clack/prompts')
  const choice = await select({
    message: 'Which strategy should run?',
    options: STRATEGY_NAMES.map(s => ({
      value: s,
      label: s,
      hint: config[STRATEGY_META[s].optionKey] == null ? 'not configured' : undefined,
    })),
  })
  if (isCancel(choice)) {
    cancel('Cancelled')
    process.exit(1)
  }

  return choice as StrategyName
}
