/**
 * Options for glob pattern migration.
 */
export interface MigrateGlobsOptions {
  /**
   * The original glob patterns to process.
   */
  globPatterns: string[]
  /**
   * The original glob ignores to preserve.
   */
  globIgnores: string[]
}

/**
 * Result of glob pattern migration.
 */
export interface MigratedGlobs {
  patterns: string[]
  ignore: string[]
}

/**
 * Translates an array of glob patterns from the `node-glob` (minimatch) format
 * to the `tinyglobby` (picomatch) format, separating negation patterns.
 *
 * @param options {MigrateGlobsOptions} The glob options object.
 * @returns {MigratedGlobs} The patterns and ignore rules for picomatch.
 */
export function migrateGlobsToPicomatch(options: MigrateGlobsOptions): MigratedGlobs {
  const patterns = new Set<string>()
  const ignore = new Set<string>(options.globIgnores)

  for (const pattern of options.globPatterns) {
    const trimmedPattern = pattern.trim()

    // 1. Ignore comments and empty lines
    if (trimmedPattern === '' || trimmedPattern.startsWith('#')) {
      continue
    }

    // 2. Separate negation patterns
    if (trimmedPattern.startsWith('!')) {
      // Remove the leading '!' and add to ignores.
      // picomatch doesn't want the '!' in the ignore list.
      ignore.add(trimmedPattern.substring(1))
    }
    else {
      patterns.add(trimmedPattern)
    }
  }

  return {
    patterns: [...patterns],
    ignore: [...ignore],
  }
}
