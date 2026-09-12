import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it, vi } from 'vitest'
import { DEFAULT_CONFIG_FILES, loadCliConfiguration, resolveDefaultConfig } from '../src/config'

const fixtures = fileURLToPath(new URL('./fixtures', import.meta.url))

describe('resolveDefaultConfig', () => {
  it('lists every workbox.config.[cm]?[tj]s variant in precedence order', () => {
    expect([...DEFAULT_CONFIG_FILES]).toEqual([
      'workbox.config.js',
      'workbox.config.mjs',
      'workbox.config.cjs',
      'workbox.config.ts',
      'workbox.config.mts',
      'workbox.config.cts',
    ])
  })

  it('returns the highest-precedence file when several exist', () => {
    const dir = path.join(fixtures, 'discover-multi')
    expect(resolveDefaultConfig(dir)).toBe(path.join(dir, 'workbox.config.js'))
  })

  it('scans past missing higher-precedence names', () => {
    const dir = path.join(fixtures, 'discover-cjs')
    expect(resolveDefaultConfig(dir)).toBe(path.join(dir, 'workbox.config.cjs'))
  })

  it('returns undefined when no default config exists', () => {
    expect(resolveDefaultConfig(path.join(fixtures, 'discover-none'))).toBeUndefined()
  })

  it('defaults to process.cwd() when no cwd argument is given', () => {
    const cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(path.join(fixtures, 'discover-none'))
    expect(resolveDefaultConfig()).toBeUndefined()
    cwdSpy.mockRestore()
  })
})

describe('loadCliConfiguration', () => {
  it('loads an explicit config path and surfaces CLI-only strategies', async () => {
    const config = await loadCliConfiguration(
      path.join(fixtures, 'load', 'workbox.config.mjs'),
    )
    expect(config.strategy).toBe('get-manifest')
    expect(config.getManifest?.globDirectory).toBe('public')
  })

  it('returns an empty config when neither a path nor a default file is found', async () => {
    const config = await loadCliConfiguration()
    expect(config.strategy).toBeUndefined()
  })

  it('enables selfDestroying via the -s flag even when the config omits it', async () => {
    const config = await loadCliConfiguration(
      path.join(fixtures, 'load', 'workbox.config.mjs'),
      true,
    )
    expect(config.selfDestroying?.selfDestroying).toBe(true)
  })

  it('leaves selfDestroying untouched when neither the flag nor config set it', async () => {
    const config = await loadCliConfiguration(
      path.join(fixtures, 'load', 'workbox.config.mjs'),
      false,
    )
    expect(config.selfDestroying).toBeUndefined()
  })

  it('the -s flag overrides an explicit selfDestroying:false in config', async () => {
    const config = await loadCliConfiguration(
      path.join(fixtures, 'self-destroy', 'workbox.config.mjs'),
      true,
    )
    expect(config.selfDestroying?.selfDestroying).toBe(true)
    expect(config.selfDestroying?.swDest).toBe('custom-sw.js')
  })

  it('does not leak selfDestroying state across repeated calls with the same path', async () => {
    const fixturePath = path.join(fixtures, 'load', 'workbox.config.mjs')

    const withFlag = await loadCliConfiguration(fixturePath, true)
    expect(withFlag.selfDestroying?.selfDestroying).toBe(true)

    const withoutFlag = await loadCliConfiguration(fixturePath, false)
    expect(withoutFlag.selfDestroying).toBeUndefined()
  })
})
