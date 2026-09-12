export interface BuildSWResult {
  rolldown?: boolean
  vite?: boolean
}

export interface GenerateSWDependenciesResult extends BuildSWResult {
  magicast?: boolean
}

/**
 * Options to detect bundlers and magicast versions.
 */
export interface DetectorOptions {
  /**
   * Vite ^8.0.0 detected.
   */
  vite?: true
  /**
   * Rolldown ^1.0.0-0 detected.
   */
  rolldown?: true
  /**
   * Magicast ^0.5.0 detected.
   */
  magicast?: true
}

/**
 * Result of the detection.
 */
export interface DetectorResult {
  /**
   * Vite ^8.0.0 detected, `false` if not requested or not detected.
   */
  vite: boolean
  /**
   * Rolldown ^1.0.0-0 detected, `false` if not requested or not detected.
   */
  rolldown: boolean
  /**
   * Magicast ^0.5.0 detected, `false` if not requested or not detected.
   */
  magicast: boolean
}
