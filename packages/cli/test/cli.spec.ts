import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { version } from '../package.json'

const bin = fileURLToPath(new URL('../bin/workbox-cli.mjs', import.meta.url))
const distEntry = fileURLToPath(new URL('../dist/cli.mjs', import.meta.url))

const tmpRoots: string[] = []

function makeDir(): string {
  const dir = mkdtempSync(path.join(tmpdir(), 'wbx-cli-'))
  tmpRoots.push(dir)
  return dir
}

function withAssets(dir: string): string {
  const assets = path.join(dir, 'assets')
  mkdirSync(assets, { recursive: true })
  writeFileSync(path.join(assets, 'a.css'), 'body{}')
  return assets
}

function write(dir: string, file: string, contents: string): void {
  writeFileSync(path.join(dir, file), contents)
}

function runCli(args: string[], cwd: string) {
  return spawnSync(process.execPath, [bin, ...args], {
    cwd,
    encoding: 'utf8',
    env: process.env,
  })
}

function esm(globDirectory: string) {
  return `export default { strategy: 'get-manifest', getManifest: { globDirectory: ${JSON.stringify(globDirectory)} } }\n`
}
function cjs(globDirectory: string) {
  return `module.exports = { strategy: 'get-manifest', getManifest: { globDirectory: ${JSON.stringify(globDirectory)} } }\n`
}

beforeAll(() => {
  if (!existsSync(distEntry)) {
    throw new Error(
      `Missing ${distEntry}. Build the package before the CLI e2e tests — `
      + `run "pnpm run build", or use the "test"/"test:ci" scripts which build first.`,
    )
  }
})

afterAll(() => {
  for (const dir of tmpRoots)
    rmSync(dir, { recursive: true, force: true })
})

describe('help & version', () => {
  it.each(['--help', '-h'])('prints usage for %s and exits 0', (flag) => {
    const { status, stdout } = runCli([flag], makeDir())
    expect(status).toBe(0)
    expect(stdout).toContain('Usage: workbox-cli')
    expect(stdout).toContain('workbox.config.{js,mjs,cjs,ts,mts,cts}')
  })

  it.each(['--version', '-v'])('prints the version for %s and exits 0', (flag) => {
    const { status, stdout } = runCli([flag], makeDir())
    expect(status).toBe(0)
    expect(stdout.trim()).toBe(version)
  })
})

describe('default config discovery loads every module format', () => {
  const formats = [
    { name: '.mjs (ESM)', file: 'workbox.config.mjs', type: undefined as string | undefined, body: esm },
    { name: '.cjs (CommonJS)', file: 'workbox.config.cjs', type: undefined, body: cjs },
    { name: '.js + type:module', file: 'workbox.config.js', type: 'module', body: esm },
    { name: '.js + type:commonjs', file: 'workbox.config.js', type: 'commonjs', body: cjs },
    { name: '.mts (ESM + TS)', file: 'workbox.config.mts', type: undefined, body: esm },
    { name: '.cts (CommonJS + TS)', file: 'workbox.config.cts', type: undefined, body: cjs },
    { name: '.ts + type:module', file: 'workbox.config.ts', type: 'module', body: esm },
  ]

  it.each(formats)('discovers and runs $name', ({ file, type, body }) => {
    const dir = makeDir()
    const assets = withAssets(dir)
    if (type)
      write(dir, 'package.json', `{"type":"${type}"}\n`)
    write(dir, file, body(assets))

    const { status, stdout } = runCli([], dir)
    expect(status).toBe(0)
    expect(stdout).toContain(`Using config ${file}`)
  })
})

describe('strategy resolution', () => {
  it('runs the strategy named by the discovered config', () => {
    const dir = makeDir()
    write(dir, 'workbox.config.mjs', esm(withAssets(dir)))
    expect(runCli([], dir).status).toBe(0)
  })

  it('lets -c override the config file strategy', () => {
    const dir = makeDir()
    const assets = withAssets(dir)
    write(
      dir,
      'workbox.config.mjs',
      `export default { strategy: 'generate-sw', generateSW: {}, getManifest: { globDirectory: ${JSON.stringify(assets)} } }\n`,
    )
    const { status, stdout } = runCli(['-c', 'get-manifest'], dir)
    expect(status).toBe(0)
    expect(stdout).toContain('Using config workbox.config.mjs')

    expect(stdout).toMatch(/strategy\s+get-manifest/)
    expect(stdout).toContain('[Vite PWA] get-manifest complete')

    expect(stdout).not.toMatch(/strategy\s+generate-sw/)
    expect(stdout).not.toContain('generate-sw complete')
  })

  it('lets -c outrank -i (no prompt when both are passed)', () => {
    const dir = makeDir()
    const assets = withAssets(dir)
    write(dir, 'workbox.config.mjs', `export default { getManifest: { globDirectory: ${JSON.stringify(assets)} } }\n`)
    const { status, stderr } = runCli(['-c', 'get-manifest', '-i'], dir)
    expect(stderr).not.toContain('requires a TTY')
    expect(status).toBe(0)
  })

  it('discovers by precedence (.js wins over .mjs)', () => {
    const dir = makeDir()
    write(dir, 'package.json', '{"type":"commonjs"}\n')
    write(dir, 'workbox.config.js', `module.exports = { strategy: 'bogus' }\n`)
    write(dir, 'workbox.config.mjs', esm(withAssets(dir)))

    const { status, stdout, stderr } = runCli([], dir)
    expect(stdout).toContain('Using config workbox.config.js')
    expect(stderr).toContain('Unknown strategy \'bogus\'')
    expect(status).toBe(1)
  })

  it('uses an explicit positional path without discovery', () => {
    const home = makeDir()
    const assets = withAssets(home)
    write(home, 'custom.config.mjs', esm(assets))

    const { status, stdout } = runCli([path.join(home, 'custom.config.mjs')], makeDir())
    expect(status).toBe(0)
    expect(stdout).not.toContain('Using config')
  })

  it('supports the --command=<strategy> form when the config omits a strategy', () => {
    const dir = makeDir()
    const assets = withAssets(dir)
    write(dir, 'workbox.config.mjs', `export default { getManifest: { globDirectory: ${JSON.stringify(assets)} } }\n`)
    expect(runCli(['--command=get-manifest'], dir).status).toBe(0)
  })
})

describe('error flows', () => {
  it('fails with guidance when no strategy is available', () => {
    const { status, stdout, stderr } = runCli([], makeDir())
    expect(status).toBe(1)
    expect(stderr).toContain('No strategy')
    expect(stdout).not.toContain('Using config')
  })

  it('rejects an unknown -c strategy and prints usage', () => {
    const { status, stdout, stderr } = runCli(['-c', 'nope'], makeDir())
    expect(status).toBe(1)
    expect(stderr).toContain('Unknown strategy \'nope\'')
    expect(stdout).toContain('Usage: workbox-cli')
  })

  it('rejects an invalid strategy coming from the config file', () => {
    const dir = makeDir()
    write(dir, 'workbox.config.mjs', `export default { strategy: 'bogus' }\n`)
    const { status, stderr } = runCli([], dir)
    expect(status).toBe(1)
    expect(stderr).toContain('Unknown strategy \'bogus\'')
  })

  it('fails a valid strategy that is missing required options', () => {
    const dir = makeDir()
    write(dir, 'workbox.config.mjs', `export default { strategy: 'get-manifest', getManifest: {} }\n`)
    const { status, stderr } = runCli([], dir)
    expect(status).toBe(1)
    expect(stderr).toContain('globDirectory')
  })

  it('requires a value for --command', () => {
    const { status, stderr } = runCli(['-c'], makeDir())
    expect(status).toBe(1)
    expect(stderr).toContain('Missing value for --command')
  })

  it('rejects unknown options', () => {
    const { status, stderr } = runCli(['--nope'], makeDir())
    expect(status).toBe(1)
    expect(stderr).toContain('Unknown option: --nope')
  })

  it('requires a TTY for --interactive', () => {
    const { status, stderr } = runCli(['-i'], makeDir())
    expect(status).toBe(1)
    expect(stderr).toContain('--interactive requires a TTY')
  })
})
