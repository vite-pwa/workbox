import type { SWType } from '@vite-pwa/workbox-build/types'
import type { CliStrategy, StrategyName, WorkboxCliConfig } from './options'
import { logger } from './logger'
import { STRATEGY_META } from './options'
import { runStrategy } from './run-strategy'

export async function executeStrategy(
  strategy: StrategyName,
  config: WorkboxCliConfig<CliStrategy, SWType>,
) {
  const shouldSelfDestroy = STRATEGY_META[strategy].isSwBuilder
    && !!config.selfDestroying?.selfDestroying

  await runStrategy(strategy, config)
  logger.success(`${strategy} complete`)

  if (shouldSelfDestroy) {
    await runStrategy('self-destroy-sw', config)
    logger.success('self-destroying SW complete')
  }
}
