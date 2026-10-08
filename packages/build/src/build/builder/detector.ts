import type { Bundler } from './bundler-types'
import type { BuildSWResult, DetectorOptions, DetectorResult, GenerateSWDependenciesResult } from './detector-types'
import { readFileSync } from 'node:fs'
import { findPackageJSON } from 'node:module'
import process from 'node:process'
import { pathToFileURL } from 'node:url'
import { getMajor, isGreaterThanOrEqual } from 'verkit'
import { BundlerNames } from './utils'

const base = pathToFileURL(`${process.cwd()}/`).href

const VITE_PLUS_CORE_PKG_NAME = '@voidzero-dev/vite-plus-core'

type Specifier = 'magicast' | 'vite' | 'rolldown'
interface PkgJson {
  name: string
  version: string
  bundledVersions?: {
    vite: string
    rolldown: string
  }
}

// Helper function to resolve the effective package.json,
// handling the Vite+ Core alias edge case for Rolldown.
function resolveEffectivePkg(specifier: string): PkgJson | undefined {
  const p = findPackageJSON(specifier, base)
  let pkg: PkgJson | undefined

  if (p) {
    pkg = JSON.parse(readFileSync(p, 'utf8'))
  }

  // Detect Rolldown via Vite+ when not installed directly.
  // See: https://github.com/voidzero-dev/vite-plus/discussions/990
  if (specifier === 'rolldown' && pkg?.name !== VITE_PLUS_CORE_PKG_NAME) {
    const vitePath = findPackageJSON('vite', base)
    if (vitePath) {
      const vitePkg: PkgJson = JSON.parse(readFileSync(vitePath, 'utf8'))
      if (vitePkg?.name === VITE_PLUS_CORE_PKG_NAME) {
        return vitePkg // Override with the Vite+ Core package
      }
    }
  }

  return pkg
}

function readPkgVersion(specifier: Specifier): string | undefined {
  const pkg = resolveEffectivePkg(specifier)

  if (!pkg) {
    return undefined
  }

  if (!pkg) {
    return undefined
  }
  if (pkg.name === VITE_PLUS_CORE_PKG_NAME) {
    if (specifier === 'vite') {
      return pkg.bundledVersions?.vite
    }
    if (specifier === 'rolldown') {
      return pkg.bundledVersions?.rolldown
    }
  }
  return typeof pkg.version === 'string' ? pkg.version : undefined
}

export function collectVersionInfo(bundler: Bundler, fallback: string): string {
  try {
    const pkg = resolveEffectivePkg(bundler)

    if (!pkg) {
      return fallback
    }

    if (pkg.name === VITE_PLUS_CORE_PKG_NAME) {
      if (bundler === 'vite') {
        if (!pkg.bundledVersions?.vite) {
          return fallback
        }
        return `${BundlerNames[bundler]} ${pkg.bundledVersions.vite} via Vite+ ${pkg.version}`
      }
      if (bundler === 'rolldown') {
        if (!pkg.bundledVersions?.rolldown) {
          return fallback
        }
        return `${BundlerNames[bundler]} ${pkg.bundledVersions.rolldown} via Vite+ ${pkg.version}`
      }
    }

    return `${BundlerNames[bundler]} ${pkg.version}`
  }
  catch {
    return fallback
  }
}

export async function detectRolldown(): Promise<boolean | undefined> {
  try {
    const version = readPkgVersion('rolldown')
    if (!version) {
      return false
    }
    return getMajor(version) >= 1
  }
  catch { return undefined }
}

export async function detectMagicast(): Promise<boolean | undefined> {
  try {
    const version = readPkgVersion('magicast')
    if (!version) {
      return false
    }
    return isGreaterThanOrEqual(version, '0.5.0')
  }
  catch { return undefined }
}

export async function detectVite(): Promise<boolean | undefined> {
  try {
    const version = readPkgVersion('vite')
    if (!version) {
      return false
    }
    return getMajor(version) >= 8
  }
  catch { return undefined }
}
export async function detectViteEnvironmentApi(): Promise<boolean | undefined> {
  try {
    const version = readPkgVersion('vite')
    if (!version) {
      return false
    }
    return getMajor(version) >= 6
  }
  catch { return undefined }
}

export async function detect(options: DetectorOptions): Promise<DetectorResult> {
  const [
    vite,
    rolldown,
    magicast,
  ] = await Promise.allSettled([
    options.vite ? detectVite() : Promise.resolve(false),
    options.rolldown ? detectRolldown() : Promise.resolve(false),
    options.magicast ? detectMagicast() : Promise.resolve(false),
  ])

  return {
    vite: vite.status === 'fulfilled' ? vite.value === true : false,
    rolldown: rolldown.status === 'fulfilled' ? rolldown.value === true : false,
    magicast: magicast.status === 'fulfilled' ? magicast.value === true : false,
  }
}

export async function detectRolldownAndVite(): Promise<BuildSWResult> {
  const [rolldown, vite] = await Promise.allSettled([
    detectRolldown(),
    detectVite(),
  ])

  return {
    rolldown: rolldown.status === 'fulfilled' ? rolldown.value : undefined,
    vite: vite.status === 'fulfilled' ? vite.value : undefined,
  }
}

export async function detectBuildSWDependencies(): Promise<BuildSWResult> {
  const [rolldown, vite] = await Promise.allSettled([
    detectRolldown(),
    detectVite(),
  ])

  return {
    rolldown: rolldown.status === 'fulfilled' ? rolldown.value : undefined,
    vite: vite.status === 'fulfilled' ? vite.value : undefined,
  }
}

export function includeRolldownOxcPlugin() {
  try {
    const version = readPkgVersion('rolldown')
    if (!version) {
      return true
    }
    return isGreaterThanOrEqual('1.1.2', version)
  }
  catch {
    return false
  }
}

export async function detectGenerateSWDependencies(): Promise<GenerateSWDependenciesResult> {
  const [rolldown, magicast, vite] = await Promise.allSettled([
    detectRolldown(),
    detectMagicast(),
    detectVite(),
  ])

  return {
    rolldown: rolldown.status === 'fulfilled' ? rolldown.value : undefined,
    magicast: magicast.status === 'fulfilled' ? magicast.value : undefined,
    vite: vite.status === 'fulfilled' ? vite.value : undefined,
  }
}
