// NOTE: this is a clone of packages/vite/src/node/env.ts at vite repo
import type { DotenvPopulateInput } from 'dotenv-expand'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { parseEnv } from 'node:util'
import { expand } from 'dotenv-expand'
import pc from 'picocolors'
import { normalizePath } from '../../utils/resolve-sw-names'

// hoist regexps
const emptyRegexp = /\s/

function arraify<T>(input: T | T[]): T[] {
  return Array.isArray(input) ? input : [input]
}

function tryStatSync(file: string): fs.Stats | undefined {
  try {
    // The "throwIfNoEntry" is a performance optimization for cases where the file does not exist
    return fs.statSync(file, { throwIfNoEntry: false })
  }
  catch {
    // Ignore errors
  }
}

export function getEnvFilesForMode(
  mode: string,
  envDir: string | false,
): string[] {
  if (envDir !== false) {
    return [
      /** default file */ `.env`,
      /** local file */ `.env.local`,
      /** mode file */ `.env.${mode}`,
      /** mode local file */ `.env.${mode}.local`,
    ].map(file => normalizePath(path.resolve(path.join(envDir, file))))
  }

  return []
}

export function loadEnv(
  mode: string,
  envDir: string | false,
  prefixes: string | string[],
): Record<string, string> {
  if (mode === 'local') {
    throw new Error(
      '"local" cannot be used as a mode name because it conflicts with the .local postfix for .env files.',
    )
  }

  prefixes = arraify(prefixes)
  const env: Record<string, string> = {}
  const envFiles = getEnvFilesForMode(mode, envDir)

  const parsed = Object.fromEntries(
    envFiles.flatMap((filePath) => {
      const stat = tryStatSync(filePath)
      // Support FIFOs (named pipes) for apps like 1Password
      if (!stat || (!stat.isFile() && !stat.isFIFO()))
        return []

      const parsedEnv = parseEnv(fs.readFileSync(filePath, 'utf-8'))
      return Object.entries(parsedEnv as Record<string, string>)
    }),
  )

  // We create a local workspace for environment variables to avoid mutating global process.env.
  // This ensures the library is a "good citizen" and doesn't cause side effects in the user's process.
  const workspaceEnv = Object.assign({}, process.env) as DotenvPopulateInput

  // Handle NODE_ENV override logic locally within our workspace.
  if (parsed.NODE_ENV && workspaceEnv.VITE_USER_NODE_ENV === undefined) {
    workspaceEnv.VITE_USER_NODE_ENV = parsed.NODE_ENV
  }

  // Let environment variables use each other via interpolation.
  // dotenv-expand uses our workspaceEnv to resolve variables without global assignment.
  expand({ parsed, processEnv: workspaceEnv })

  // Priority 1: Expose keys from .env files that match the allowed prefixes.
  for (const [key, value] of Object.entries(parsed)) {
    if (prefixes.some(prefix => key.startsWith(prefix))) {
      env[key] = value
    }
  }

  // Priority 2: System environment variables always take precedence over .env files.
  for (const key in process.env) {
    if (prefixes.some(prefix => key.startsWith(prefix))) {
      env[key] = process.env[key]!
    }
  }

  return env
}

export function resolveEnvPrefix(
  envPrefix: string | string[],
): string[] {
  envPrefix = arraify(envPrefix)

  if (envPrefix.includes('')) {
    throw new Error(
      `\n${pc.red(pc.bold('[Vite PWA]'))} ${pc.red('Invalid envPrefix value!')}\n`
      + `The ${pc.green('envPrefix')} option contains an empty string ${pc.cyan('\'\'')}, which could lead to unexpected exposure of sensitive information.\n`,
    )
  }

  if (envPrefix.some(prefix => emptyRegexp.test(prefix))) {
    console.warn(
      `\n${pc.yellow(pc.bold('[Vite PWA]'))} ${pc.yellow('Warning:')} `
      + `The ${pc.green('envPrefix')} option contains values with whitespace, which does not work in practice.\n`,
    )
  }

  return envPrefix
}
