import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import process from 'node:process'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { buildSW as rolldownBuildSW } from '../src/build/rolldown/build-sw'
import { generateSW as rolldownGenerateSW } from '../src/build/rolldown/generate-sw'
import { buildSW as viteBuildSW } from '../src/build/vite/build-sw'
import { generateSW as viteGenerateSW } from '../src/build/vite/generate-sw'
import { buildSWLegacy } from '../src/build/vite/legacy-build-sw'
import { generateSWLegacy } from '../src/build/vite/legacy-generate-sw'

const swSource = `
import { precacheAndRoute } from '@vite-pwa/workbox-swkit/precaching';
precacheAndRoute(self.__WB_MANIFEST);
`

const common = {
  globPatterns: ['**/*.html'],
  inlineWorkboxRuntime: true,
  sourcemap: false,
  mode: 'production',
  logLevel: 'silent',
} as const

describe('project without workbox-build dependencies installed in its root', () => {
  const cwd = process.cwd()
  let root: string
  let dist: string

  beforeEach(async () => {
    root = await fs.realpath(await fs.mkdtemp(path.join(os.tmpdir(), 'vite-pwa-swkit-')))
    process.chdir(root)
    dist = path.join(root, 'dist')
    await fs.mkdir(dist, { recursive: true })
    await fs.writeFile(path.join(dist, 'index.html'), '<html></html>')
    await fs.writeFile(path.join(root, 'sw.js'), swSource)
  })

  afterEach(async () => {
    process.chdir(cwd)
    await fs.rm(root, { recursive: true, force: true })
  })

  async function readSW() {
    return await fs.readFile(path.join(dist, 'sw.js'), 'utf8')
  }

  function expectSWKitBundled(sw: string) {
    expect(sw).not.toMatch(/@vite-pwa\/workbox-swkit\//)
    expect(sw).toContain('index.html')
  }

  async function installProjectSWKit() {
    const pkg = path.join(root, 'node_modules/@vite-pwa/workbox-swkit')
    await fs.mkdir(pkg, { recursive: true })
    await fs.writeFile(path.join(pkg, 'package.json'), JSON.stringify({
      name: '@vite-pwa/workbox-swkit',
      type: 'module',
      exports: { './precaching': './precaching.js' },
    }))
    await fs.writeFile(
      path.join(pkg, 'precaching.js'),
      'export function precacheAndRoute(entries) { console.log("project-swkit", entries) }',
    )
  }

  it('detects magicast and bundlers from the workbox-build location', async () => {
    vi.resetModules()
    const { generateModernSW } = await import('../src/generate-sw')

    await generateModernSW({
      ...common,
      swDest: path.join(dist, 'sw.js'),
      globDirectory: dist,
    })

    expectSWKitBundled(await readSW())
  })

  it.each([
    ['vite', viteGenerateSW, { vite: 'silent' }],
    ['rolldown', rolldownGenerateSW, { rolldown: 'silent' }],
    ['legacy', generateSWLegacy, { rolldown: 'silent' }],
  ] as const)('resolves swkit in generateSW (%s)', async (_, generateSW, bundlerLogLevel) => {
    await generateSW({
      ...common,
      swDest: path.join(dist, 'sw.js'),
      globDirectory: dist,
      bundlerLogLevel,
    })

    expectSWKitBundled(await readSW())
  })

  it.each([
    ['vite', viteGenerateSW, { vite: 'silent' }],
    ['rolldown', rolldownGenerateSW, { rolldown: 'silent' }],
    ['legacy', generateSWLegacy, { rolldown: 'silent' }],
  ] as const)('ignores a project swkit in generateSW (%s)', async (_, generateSW, bundlerLogLevel) => {
    await installProjectSWKit()

    await generateSW({
      ...common,
      swDest: path.join(dist, 'sw.js'),
      globDirectory: dist,
      bundlerLogLevel,
    })

    const sw = await readSW()
    expectSWKitBundled(sw)
    expect(sw).not.toContain('project-swkit')
  })

  it.each([
    ['vite', viteBuildSW, { vite: 'silent' }],
    ['rolldown', rolldownBuildSW, { rolldown: 'silent' }],
    ['legacy', buildSWLegacy, { rolldown: 'silent' }],
  ] as const)('resolves swkit in buildSW (%s)', async (_, buildSW, bundlerLogLevel) => {
    await buildSW({
      ...common,
      swSrc: path.join(root, 'sw.js'),
      swDest: path.join(dist, 'sw.js'),
      globDirectory: dist,
      bundlerLogLevel,
    })

    expectSWKitBundled(await readSW())
  })

  it.each([
    ['vite', viteBuildSW, { vite: 'silent' }],
    ['rolldown', rolldownBuildSW, { rolldown: 'silent' }],
  ] as const)('prefers the swkit resolved from the buildSW source (%s)', async (_, buildSW, bundlerLogLevel) => {
    await installProjectSWKit()

    await buildSW({
      ...common,
      swSrc: path.join(root, 'sw.js'),
      swDest: path.join(dist, 'sw.js'),
      globDirectory: dist,
      bundlerLogLevel,
    })

    expect(await readSW()).toContain('project-swkit')
  })
})
