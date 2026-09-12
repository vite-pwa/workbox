import { describe, expect, it } from 'vitest'
import { STRATEGY_NAMES } from '../src/options'

describe('strategy names', () => {
  it('lists every strategy in the order shown in --help', () => {
    expect(STRATEGY_NAMES).toEqual([
      'generate-sw',
      'inject-manifest',
      'build-sw',
      'get-manifest',
      'self-destroy-sw',
    ])
  })
})
