import type {
  GenerateSWOptions,
  GetManifestOptions,
  InjectManifestOptions,
  SWTarget,
  SWType,
} from '../src/types'
import { randomUUID } from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { test as base } from 'vitest'

export const defaultTargets = {
  target: <SWTarget>{
    classic: ['chrome56', 'safari11', 'firefox60'],
    module: 'baseline-widely-available',
  },
}

export const injectManifestFixture = path.relative(process.cwd(), path.resolve(import.meta.dirname, 'fixtures/fixture-inject-manifest'))
export const generateSWFixture = path.relative(process.cwd(), path.resolve(import.meta.dirname, 'fixtures/fixture-generate-sw'))

export function createGenerateSWOptions<T extends SWType>(
  swType: T,
  withGlobDirectory = true,
  options: Partial<GenerateSWOptions<T>> = {},
) {
  const swDest = path.relative(
    process.cwd(),
    path.resolve(import.meta.dirname, 'fixtures/fixture-generate-sw', 'sw.js'),
  ).replace(/\\/g, '/')
  const globDirectory = path.relative(
    process.cwd(),
    path.resolve(import.meta.dirname, 'fixtures/fixture-generate-sw'),
  ).replace(/\\/g, '/')
  return {
    swDest,
    globDirectory,
    options: Object.assign(
      {},
      {
        swType,
        globDirectory: withGlobDirectory
          ? globDirectory
          : undefined,
        swDest,
      },
      options,
    ) satisfies GenerateSWOptions<T>,
  }
}

type BuildSWOptionsType<
  T extends SWType,
  B extends 'vite' | 'rolldown' = 'vite',
> = B extends 'vite'
  ? import('../src/build/vite/types').BuildServiceWorkerOptions<T>
  : import('../src/build/rolldown/types').BuildServiceWorkerOptions<T>

export function createBuildSWOptions<
  T extends SWType,
  B extends 'vite' | 'rolldown' = 'vite',
>(
  swType: T,
  options: Partial<BuildSWOptionsType<T, B>> = {},
) {
  const swSrc = path.relative(
    process.cwd(),
    path.resolve(import.meta.dirname, 'fixtures/fixture-build-sw/sw.js'),
  )
  const swDest = path.relative(
    process.cwd(),
    path.resolve(import.meta.dirname, 'fixtures/fixture-build-sw', `generated-${path.basename(swSrc)}`),
  ).replace(/\\/g, '/')
  const globDirectory = path.relative(
    process.cwd(),
    path.resolve(import.meta.dirname, 'fixtures/fixture-build-sw'),
  ).replace(/\\/g, '/')
  return {
    swSrc,
    swDest,
    globDirectory,
    options: Object.assign(
      {},
      {
        swSrc,
        swType,
        globDirectory,
        swDest,
      },
      options,
    ),
  }
}

export function withDummyRuntimeCaching<T extends SWType>(
  swType: T,
  withGlobDirectory = false,
  options: Partial<GenerateSWOptions<T>> = {},
) {
  const data = createGenerateSWOptions(swType, withGlobDirectory, options)
  data.options.runtimeCaching = [{
    handler: 'NetworkOnly',
    method: 'GET',
    urlPattern: /.*/,
  }]
  return data
}

export function createGetManifestOptions(
  options: Partial<GetManifestOptions> = {},
) {
  const globDirectory = path.relative(
    process.cwd(),
    path.resolve(import.meta.dirname, 'fixtures/fixture-generate-sw'),
  ).replace(/\\/g, '/')
  return {
    globDirectory,
    options: Object.assign(
      {},
      {
        globDirectory,
      },
      options,
    ) satisfies GetManifestOptions,
  }
}

export function createInjectManifestOptions(
  options: Partial<InjectManifestOptions> = {},
) {
  const swSrc = path.relative(
    process.cwd(),
    path.resolve(import.meta.dirname, 'fixtures/fixture-inject-manifest', 'sw.js'),
  ).replace(/\\/g, '/')
  const swDest = path.relative(
    process.cwd(),
    path.resolve(import.meta.dirname, 'fixtures/fixture-inject-manifest', 'sw-test.js'),
  ).replace(/\\/g, '/')
  const globDirectory = path.relative(
    process.cwd(),
    path.resolve(import.meta.dirname, 'fixtures/fixture-inject-manifest'),
  ).replace(/\\/g, '/')
  return {
    globDirectory,
    swDest,
    swSrc,
    options: Object.assign(
      {},
      {
        globDirectory,
        swDest,
        swSrc,
      },
      options,
    ) satisfies InjectManifestOptions,
  }
}

async function createSandbox(fixtureName: string, prefix: string, use: (path: string) => Promise<void>) {
  const id = randomUUID()
  const fixtureSource = path.resolve(import.meta.dirname, `fixtures/${fixtureName}`)
  const tempPath = path.resolve(import.meta.dirname, `fixtures/${prefix}-${id}`)

  try {
    await fs.mkdir(tempPath, { recursive: true })
    await fs.cp(fixtureSource, tempPath, { recursive: true })
    await use(tempPath)
  }
  finally {
    await fs.rm(tempPath, {
      recursive: true,
      force: true,
      maxRetries: 3,
      retryDelay: 100,
    }).catch((err) => {
      console.error(`Failed to cleanup sandbox at ${tempPath}:`, err)
    })
  }
}

export const testGenerateSW = base.extend<{ sandbox: string }>({
  // eslint-disable-next-line no-empty-pattern
  sandbox: async ({}, use) => {
    await createSandbox('fixture-generate-sw', 'gsw', use)
  },
})

export const testInjectManifest = base.extend<{ sandbox: string }>({
  // eslint-disable-next-line no-empty-pattern
  sandbox: async ({}, use) => {
    await createSandbox('fixture-inject-manifest', 'im', use)
  },
})
