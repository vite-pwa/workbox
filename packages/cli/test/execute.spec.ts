import type { StrategyName } from '../src/options'
import { beforeEach, expect, it, vi } from 'vitest'
import { executeStrategy } from '../src/execute'
import { STRATEGY_META } from '../src/options'

const runStrategyMock = vi.hoisted(() => vi.fn())
vi.mock('../src/run-strategy', () => ({ runStrategy: runStrategyMock }))

beforeEach(() => {
  runStrategyMock.mockClear()
  runStrategyMock.mockResolvedValue({ count: 1, size: 0, warnings: [], filePaths: [] })
})

const swBuilders = (Object.keys(STRATEGY_META) as StrategyName[])
  .filter(name => STRATEGY_META[name].isSwBuilder)

it.each(swBuilders)('chains self-destroy-sw after %s when configured', async (strategy) => {
  await executeStrategy(strategy, {
    strategy,
    selfDestroying: { selfDestroying: true },
  } as any)

  expect(runStrategyMock).toHaveBeenNthCalledWith(1, strategy, expect.anything())
  expect(runStrategyMock).toHaveBeenNthCalledWith(2, 'self-destroy-sw', expect.anything())
})

it('does not chain when selfDestroying.selfDestroying is falsy', async () => {
  await executeStrategy('generate-sw', { strategy: 'generate-sw', generateSW: {} } as any)
  expect(runStrategyMock).toHaveBeenCalledTimes(1)
})

it('does not chain for get-manifest even if selfDestroying is true', async () => {
  await executeStrategy('get-manifest', {
    strategy: 'get-manifest',
    getManifest: { globDirectory: '.' },
    selfDestroying: { selfDestroying: true },
  } as any)
  expect(runStrategyMock).toHaveBeenCalledTimes(1)
})
