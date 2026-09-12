import type {
  Bundler,
  CircularDependenciesOptions,
  RolldownOptions,
} from './bundler-types'

export function prepareCircularDependencies<T extends Bundler>(
  options: RolldownOptions<T>,
): CircularDependenciesOptions<T> {
  return options.detectCircularDeps
    ? {
        checks: {
          circularDependency: true,
        },
        onLog: (level, log, defaultHandler) => {
          if (log.code === 'CIRCULAR_DEPENDENCY') {
            options.circularDependencies.push(log.message || 'Circular dependency detected.')
            return // Ignore/swallow the raw native circular dependency warning
          }
          if (level === 'warn') {
            defaultHandler('error', log) // turn other warnings into errors
          }
          else {
            defaultHandler(level, log) // otherwise, just print the log
          }
        },
      } as CircularDependenciesOptions<T>
    : {} as CircularDependenciesOptions<T>
}
