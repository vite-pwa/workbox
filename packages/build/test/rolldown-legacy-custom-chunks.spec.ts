import path from 'node:path'
import process from 'node:process'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { runCustomChunksScenario } from './utils/custom-chunks-utils'

// 1. Vitest mocks registered BEFORE importing any source code.
// We redirect 'rolldown' to the rolldown-legacy alias we installed in the catalog.
vi.mock('rolldown', async () => await vi.importActual('rolldown-legacy'))
vi.mock('rolldown/utils', async () => await vi.importActual('rolldown-legacy/utils'))

// Intercept the resolution of package.json to hack the detector.ts
vi.mock('node:module', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:module')>()
  return {
    ...actual,
    findPackageJSON: (specifier: string | URL, base?: string | URL) => {
      if (specifier === 'rolldown') {
        return path.resolve(process.cwd(), 'node_modules/rolldown-legacy/package.json')
      }
      return actual.findPackageJSON(specifier, base)
    },
  }
})

describe('older rolldown (1.2.9) custom chunks', () => {
  let warnSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    warnSpy = vi.spyOn(console, 'warn')
  })

  afterEach(() => {
    warnSpy.mockRestore()
    vi.restoreAllMocks()
  })

  it('supports custom chunks for classic service workers on 1.2.9', async () => {
    const { buildSW } = await import('../src/build/rolldown/build-sw')
    await runCustomChunksScenario(buildSW, 'classic')
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Expected never but received "debugName"'),
    )
  })

  it('supports custom chunks for module service workers on 1.2.9', async () => {
    const { buildSW } = await import('../src/build/rolldown/build-sw')
    await runCustomChunksScenario(buildSW, 'module')
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Expected never but received "debugName"'),
    )
  })
})
