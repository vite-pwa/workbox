import type { DetectorOptions, DetectorResult, GenerateSWDependenciesResult } from './detector-types'
import { errStyle } from '../../utils/colors'

/**
 * Checks for GenerateSW dependencies based on Vite version and Rolldown availability.
 * If Vite < 8.0.0 is used, Rolldown is mandatory for the orchestration.
 *
 * @param result - The dependency detection result (versions and presence).
 * @param result.magicast - Magicast availability
 * @param result.rolldown - Rolldown version/availability
 * @param result.vite - Vite version/availability
 * @param isDev - Whether to log a warning (dev) or return an error string (build).
 */
export function checkGenerateSWDependencies(
  { magicast, rolldown, vite }: GenerateSWDependenciesResult,
  isDev = false,
): string | undefined {
  // 1. Magicast is always required for AST code generation.
  // 2. We need a valid bundler:
  //    - Rolldown >= 1.0.0-0 OR
  //    - Vite >= 8.0.0 (which includes Rolldown internally)
  const isVite8 = vite === true
  const hasValidBundler = rolldown || isVite8

  if (magicast && hasValidBundler) {
    return undefined
  }

  const color = isDev ? 'yellow' : 'red'
  const title = isDev ? 'POTENTIAL BUILD FAILURE' : 'MISSING DEPENDENCIES'
  const missing: string[] = []
  const incompatible: string[] = []

  // Magicast check
  if (magicast === undefined) {
    missing.push('magicast')
  }
  else if (!magicast) {
    incompatible.push('magicast (^0.5.0)')
  }

  let addVite8Incompatibility = false

  // Bundler logic check
  if (!rolldown && !isVite8) {
    if (vite === false) {
      // Vite is present but version is < 8.0.0
      incompatible.push('vite (^8.0.0)')
      addVite8Incompatibility = true
    }
    else if (rolldown === false) {
      incompatible.push('rolldown (^1.0.0-0)')
    }
    else {
      missing.push('rolldown')
    }
  }

  if (missing.length === 0 && incompatible.length === 0) {
    return undefined
  }

  const lines = [
    `\n${errStyle([color, 'bold'], '[Vite PWA]')} ${errStyle(color, title)}`,
    `The ${errStyle('cyan', 'generateSW')} strategy requires additional dependencies to generate the Service Worker.\n`,
    addVite8Incompatibility
      ? `${errStyle('cyan', 'Note:')} Your Vite version is < 8. To use ${errStyle('green', 'generateSW')}, you must either upgrade Vite or install ${errStyle('green', 'rolldown')}.\n`
      : undefined,
  ].filter(Boolean) as string[]

  if (missing.length > 0) {
    lines.push(`${errStyle('bold', 'Missing dependencies:')}`)
    missing.forEach(dep => lines.push(`  - ${errStyle('red', dep)}`))
    lines.push('')
  }

  if (incompatible.length > 0) {
    lines.push(`${errStyle('bold', 'Incompatible versions:')}`)
    incompatible.forEach(dep => lines.push(`  - ${errStyle('yellow', dep)}`))
    lines.push('')
  }

  lines.push(`${errStyle('bold', 'To resolve this, please run:')}`)

  const toInstall: string[] = []
  if (!magicast) {
    toInstall.push('magicast')
  }

  // If Vite is legacy (< 8) or missing, we force/suggest Rolldown
  if (!rolldown) {
    toInstall.push('rolldown')
  }

  lines.push(`  ${errStyle('green', `npm add -D ${toInstall.join(' ')}`)}\n`)

  if (isDev) {
    lines.push(`${errStyle('dim', 'This check is for the "generateSW" strategy. Other strategies like "injectManifest" (legacy) might not require these.')}`)
  }
  else {
    lines.push(`${errStyle('red', 'Error: Build stopped. The current environment cannot bundle the Service Worker.')}`)
  }

  return lines.join('\n')
}

export function logDeprecatedGenerateSW() {
  console.warn([
    `\n${errStyle(['yellow', 'bold'], '[Vite PWA]')} ${errStyle('yellow', 'DEPRECATION WARNING')}:`,
    `You are using ${errStyle('cyan', 'generateSW()')}, which is now deprecated.`,
    `Please migrate to ${errStyle('green', 'generateModernSW()')} or ${errStyle('green', 'generateClassicSW()')}.`,
    `This function will be removed in the next major version.\n`,
  ].join('\n'))
}

/**
 * Error when the options object doesn't match any known strategy.
 */
export function throwUnknownBuildOptions(): never {
  throw new Error(
    `\n${errStyle(['red', 'bold'], '[Vite PWA]')} ${errStyle('red', 'Unknown Vite build options!')}\n`
    + `The options object must contain one of: ${errStyle('cyan', '"generateSW"')}, ${errStyle('cyan', '"injectManifest"')} or ${errStyle('cyan', '"buildSW"')}.\n`,
  )
}

/**
 * Error when buildSW is called from the generic build package instead of the vite-specific one.
 */
export function throwViteBuildOptionsRequired(): never {
  throw new Error(
    `\n${errStyle(['red', 'bold'], '[Vite PWA]')} ${errStyle('red', 'Vite-specific options detected!')}\n\n`
    + `You are using ${errStyle('cyan', '"buildSW"')}, but you imported ${errStyle('cyan', 'buildSW')} from the build subpackage export.\n`
    + `Please import it from the build Vite subpackage export instead:\n\n`
    + `  ${errStyle('green', 'import { buildSW } from \'@vite-pwa/workbox-build/build/vite\'')}\n`,
  )
}

/**
 * Error when buildSW is called but the Vite version is not compatible (Vite 8+ required).
 */
export function buildInvalidViteVersion(
  strategyName: 'generate' | 'build',
  forError: boolean,
): string {
  const color = forError ? 'red' : 'yellow'
  return [
    `\n${errStyle([color, 'bold'], '[Vite PWA]')} ${errStyle(color, 'Incompatible Vite version!')}\n`,
    `The ${errStyle('cyan', `"${strategyName}SW"`)} strategy requires ${errStyle('green', 'Vite ^8.0.0')}.`,
    `Please upgrade your Vite dependency or use ${errStyle('cyan', `"${strategyName}SWLegacy"`)} from '${errStyle('cyan', `@vite-pwa/workbox-build/vite/legacy-${strategyName}-sw`)}' instead.\n`,
    forError
      ? undefined
      : `${errStyle([color, 'bold'], 'POTENTIAL BUILD FAILURE:')} This warning will become a hard error during the production build.`,
  ].filter(Boolean).join('\n')
}

/**
 * Error when buildSW is called but the Vite version is not compatible (Vite 8+ required).
 */
export function buildInvalidViteLegacyVersion(
  strategyName: 'generate' | 'build',
  forError: boolean,
): string {
  const color = forError ? 'red' : 'yellow'
  return [
    `\n${errStyle([color, 'bold'], '[Vite PWA]')} ${errStyle(color, 'Incompatible Rolldown version!')}\n`,
    `The ${errStyle('cyan', `"${strategyName}SW"`)} for legacy strategy requires ${errStyle('green', 'Rolldown ^1.0.0-0')}.`,
    `${errStyle('bold', 'To resolve this, please run:')}`,
    `  ${errStyle('green', 'npm add -D rolldown')}\n`,
    forError
      ? `${errStyle(color, 'Error: Build stopped. Rolldown is required for code splitting in the Service Worker.')}`
      : `${errStyle(color, 'POTENTIAL BUILD ERROR: Rolldown is required for code splitting in the Service Worker.')}`,
  ].filter(Boolean).join('\n')
}

export function missingStrategy(
  forError: boolean,
  bundlerMessage: string,
) {
  const color = forError ? 'red' : 'yellow'
  return [
    `\n${errStyle([color, 'bold'], '[Vite PWA]')} ${errStyle(color, `${bundlerMessage}!`)}\n`,
    forError
      ? `${errStyle(color, 'Error: Build stopped. Strategy is required.')}`
      : `${errStyle(color, 'POTENTIAL BUILD ERROR: Strategy is required.')}`,
  ].filter(Boolean).join('\n')
}

/**
 * Validates dependencies specifically for the buildSW strategy (Vite 8+ engine).
 */
export function checkViteDependencies(
  strategyName: 'generate' | 'build',
  forError: boolean,
  options: DetectorOptions,
  { vite, magicast }: DetectorResult,
): string | undefined {
  if (vite && (!options.magicast || magicast)) {
    return undefined
  }

  if (!vite) {
    return buildInvalidViteVersion(strategyName, forError)
  }

  const color = forError ? 'red' : 'yellow'
  return [
    `\n${errStyle([color, 'bold'], '[Vite PWA]')} ${errStyle(color, 'MISSING DEPENDENCY')}`,
    `The ${errStyle('cyan', 'customChunks')} option in ${errStyle('green', `${strategyName}SW`)} requires ${errStyle('green', 'magicast')} for AST transformation.\n`,
    `${errStyle('bold', 'To resolve this, please run:')}`,
    `  ${errStyle('green', 'npm add -D magicast')}\n`,
    forError
      ? `${errStyle(color, 'Error: Build stopped. Magicast is required for code splitting in the Service Worker.')}`
      : `${errStyle(color, 'POTENTIAL BUILD ERROR: Magicast is required for code splitting in the Service Worker.')}`,
  ].join('\n')
}

/**
 * Validates dependencies specifically for the buildSW strategy (Vite 8+ engine).
 */
export function checkViteLegacyDependencies(
  strategyName: 'generate' | 'build',
  forError: boolean,
  options: DetectorOptions,
  { rolldown, magicast }: DetectorResult,
): string | undefined {
  if (rolldown && (!options.magicast || magicast)) {
    return undefined
  }

  if (!rolldown) {
    return buildInvalidViteLegacyVersion(strategyName, forError)
  }

  const color = forError ? 'red' : 'yellow'
  return [
    `\n${errStyle([color, 'bold'], '[Vite PWA]')} ${errStyle(color, 'MISSING DEPENDENCY')}`,
    `The ${errStyle('cyan', 'customChunks')} option in ${errStyle('green', `${strategyName}SW`)} requires ${errStyle('green', 'magicast')} for AST transformation.\n`,
    `${errStyle('bold', 'To resolve this, please run:')}`,
    `  ${errStyle('green', 'npm add -D magicast')}\n`,
    forError
      ? `${errStyle(color, 'Error: Build stopped. Magicast is required for code splitting in the Service Worker.')}`
      : `${errStyle(color, 'POTENTIAL BUILD ERROR: Magicast is required for code splitting in the Service Worker.')}`,
  ].join('\n')
}

/**
 * Warning when Vite version is < 7.0.0 and cannot support .env expansion/nesting
 * without external help or manual logic replication.
 */
export function logViteLoadEnvWarning() {
  console.warn([
    `\n${errStyle(['yellow', 'bold'], '[Vite PWA]')} ${errStyle('yellow', 'VITE VERSION LIMITATION')}:`,
    `Your Vite version is ${errStyle('red', '< 7.0.0')}. Variable expansion in ${errStyle('cyan', '.env')} files`,
    `(e.g., ${errStyle('dim', 'VITE_APP_URL=https://somedomain.com')}) is not natively supported for the Service Worker build.`,
    `Only simple key-value pairs will be loaded.\n`,
    `${errStyle('bold', 'To resolve this:')}`,
    `  - Upgrade to ${errStyle('green', 'Vite ^7.0.0')}.`,
    `  - Or avoid using nested variables in your .env files for SW-related configs.\n`,
  ].join('\n'))
}
