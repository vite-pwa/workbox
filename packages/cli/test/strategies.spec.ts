import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Mock the build package so strategy dispatch + reporting can be tested without
// running real (rolldown/swkit-backed) service-worker builds.
// build/generate are mocked at their rolldown subpaths, inject/get at the root package.
// Validation itself is the build package's responsibility (valibot) and is covered there.
const build = vi.hoisted(() => ({
  generateSW: vi.fn(),
  buildSW: vi.fn(),
  injectManifest: vi.fn(),
  getManifest: vi.fn(),
  selfDestroyingSW: vi.fn(),
}))

vi.mock('@vite-pwa/workbox-build/build/rolldown/build-sw', () => ({ buildSW: build.buildSW }))
vi.mock('@vite-pwa/workbox-build/build/rolldown/generate-sw', () => ({ generateSW: build.generateSW }))
vi.mock('@vite-pwa/workbox-build/self-destroying-sw', () => ({ selfDestroyingSW: build.selfDestroyingSW }))
vi.mock('@vite-pwa/workbox-build', () => ({ injectManifest: build.injectManifest, getManifest: build.getManifest }))

const { runStrategy } = await import('../src/run-strategy')

const dir = mkdtempSync(path.join(tmpdir(), 'wbx-strat-'))
const swFile = path.join(dir, 'sw.js')
writeFileSync(swFile, '// generated sw')
const buildResult = { count: 2, size: 2048, warnings: [], filePaths: [swFile] }

let info: ReturnType<typeof vi.spyOn>
let warn: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  vi.clearAllMocks()
  build.generateSW.mockResolvedValue(buildResult)
  build.buildSW.mockResolvedValue(buildResult)
  build.injectManifest.mockResolvedValue(buildResult)
  build.getManifest.mockResolvedValue({
    count: 1,
    size: 64,
    warnings: ['heads up'],
    manifestEntries: [{ url: '/a.css', revision: 'abc123' }],
  })
  info = vi.spyOn(console, 'info').mockImplementation(() => {})
  warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
})

afterEach(() => {
  info.mockRestore()
  warn.mockRestore()
})

afterAll(() => {
  rmSync(dir, { recursive: true, force: true })
})

describe('generate-sw', () => {
  it('dispatches to generateSW with the generateSW options', async () => {
    await runStrategy('generate-sw', { strategy: 'generate-sw', generateSW: { swDest: 'sw.js' } })
    expect(build.generateSW).toHaveBeenCalledWith({ swDest: 'sw.js' })
  })
})

describe('build-sw', () => {
  it('dispatches to buildSW with the buildSW options', async () => {
    const buildSW = { swSrc: 'src.js', swDest: 'sw.js', globDirectory: '.' }
    await runStrategy('build-sw', { strategy: 'build-sw', buildSW })
    expect(build.buildSW).toHaveBeenCalledWith(buildSW)
  })
})

describe('inject-manifest', () => {
  it('dispatches to injectManifest with the injectManifest options and reports', async () => {
    const injectManifest = { swSrc: 'src.js', swDest: 'sw.js', globDirectory: '.' }
    await runStrategy('inject-manifest', { strategy: 'inject-manifest', injectManifest })
    expect(build.injectManifest).toHaveBeenCalledWith(injectManifest)
    expect(info).toHaveBeenCalledWith(expect.stringContaining('inject-manifest'))
  })
})

describe('get-manifest', () => {
  it('dispatches to getManifest and prints the resolved manifest entries', async () => {
    await runStrategy('get-manifest', { strategy: 'get-manifest', getManifest: { globDirectory: '.' } })
    expect(build.getManifest).toHaveBeenCalledWith({ globDirectory: '.' })
    expect(info).toHaveBeenCalledWith(expect.stringContaining('manifest entries'))
    expect(info).toHaveBeenCalledWith(expect.stringContaining('/a.css'))
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('heads up'))
  })
})

describe('self-destroy-sw', () => {
  it('dispatches to selfDestroyingSW with the selfDestroying options', async () => {
    await runStrategy('self-destroy-sw', { strategy: 'self-destroy-sw', selfDestroying: { swDest: 'sw.js' } })
    expect(build.selfDestroyingSW).toHaveBeenCalledWith({ swDest: 'sw.js' })
  })
})
