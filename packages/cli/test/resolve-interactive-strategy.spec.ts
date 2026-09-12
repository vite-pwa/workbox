import { describe, expect, it, vi } from 'vitest'

import { resolveInteractiveStrategy } from '../src/resolve-interactive-strategy'

vi.mock('std-env', () => ({ hasTTY: true, isCI: false }))

vi.mock('@clack/prompts', () => ({
  select: vi.fn().mockResolvedValue('generate-sw'),
  isCancel: vi.fn().mockReturnValue(false),
  cancel: vi.fn(),
}))

describe('resolveInteractiveStrategy', () => {
  it('returns the strategy chosen via the prompt', async () => {
    const config = {} as any
    await expect(resolveInteractiveStrategy(config)).resolves.toBe('generate-sw')
  })

  it('marks unconfigured strategies as "not configured" in the prompt options', async () => {
    const { select } = await import('@clack/prompts')
    const config = { generateSW: {} } as any // only generate-sw is configured

    await resolveInteractiveStrategy(config)

    expect(select).toHaveBeenCalledWith(
      expect.objectContaining({
        options: expect.arrayContaining([
          expect.objectContaining({ value: 'generate-sw', hint: undefined }),
          expect.objectContaining({ value: 'get-manifest', hint: 'not configured' }),
        ]),
      }),
    )
  })

  it('exits after the prompt is cancelled', async () => {
    const { isCancel } = await import('@clack/prompts')
    vi.mocked(isCancel).mockReturnValueOnce(true)
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called')
    }) as any

    await expect(resolveInteractiveStrategy({} as any)).rejects.toThrow('process.exit called')
    exitSpy.mockRestore()
  })
})
