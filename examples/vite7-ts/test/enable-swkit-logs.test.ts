import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const _dirname = dirname(fileURLToPath(import.meta.url))

const enableSWKitLogs = process.env.ENABLE_SWKIT_LOGS === 'true'

function resolvePath(...paths: string[]) {
  return resolve(_dirname, ...paths).replace(/\\/g, '/')
}

function checkFileExists(name: 'classic' | 'module', swkitLogsEnabled: boolean) {
  const filePath = resolvePath(_dirname, `../dist/sw-${name}.js`)
  const exists = existsSync(filePath)
  expect(exists, `sw-${name}.js doesn't exist`).toBeTruthy()
  const content = readFileSync(filePath, 'utf-8')
  expect(/console.log\(`import.meta.env.BASE_URL: \/`\)/.test(content)).toBeTruthy()
  expect(/console.log\(`import.meta.env.MODE: production`\)/.test(content)).toBeTruthy()
  expect(/console.log\(`import.meta.env.DEV: false`\)/.test(content)).toBeTruthy()
  expect(/console.log\(`import.meta.env.PROD: true`\)/.test(content)).toBeTruthy()
  expect(/console.log\(`import.meta.env.SSR: false`\)/.test(content)).toBeTruthy()
  if (swkitLogsEnabled) {
    expect(/console.log\(`import.meta.env.ENABLE_SWKIT_LOGS: true`\)/.test(content)).toBeTruthy()
  }
  else {
    expect(/console.log\(`import.meta.env.ENABLE_SWKIT_LOGS: false`\)/.test(content)).toBeTruthy()
  }
  expect(/console.log\(['"]ENABLE_SWKIT_LOGS is enabled['"]\)/.test(content)).toBe(swkitLogsEnabled)

  const files = readdirSync(resolvePath(_dirname, '../dist')).filter(f => f.startsWith('workbox-') && f.endsWith('.js'))
  for (const file of files) {
    const filePath = resolvePath(_dirname, '../dist', file)
    expect(existsSync(filePath), `${filePath} doesn't exist`).toBeTruthy()
    const code = readFileSync(filePath, 'utf-8')
    expect(code.includes('process.env')).toBe(false)
    expect(code.includes('groupCollapsed')).toBe(swkitLogsEnabled)
    expect(code.includes('self.__WB_DISABLE_DEV_LOGS')).toBe(swkitLogsEnabled)
  }
}

describe('workbox-build custom SW and SWKit logs', () => {
  it.runIf(enableSWKitLogs)(`check swkit logs enabled`, () => {
    checkFileExists('classic', true)
    checkFileExists('module', true)
  })
  it.runIf(!enableSWKitLogs)(`check swkit logs disabled`, () => {
    checkFileExists('classic', false)
    checkFileExists('module', false)
  })
})
