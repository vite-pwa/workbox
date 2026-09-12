import type {
  Strategy,
  WorkboxBuildConfiguration,
} from '../../config/types'
import type { SWType } from '../../types'
import { internalWebpackBuild } from '../builder/internal-webpack-build'

/**
 * [webpack plugin](https://webpack.js.org/plugins/) for Workbox build strategies.
 * **WARNING**: strategy from the resolved options will override the strategy used in the plugin constructor.
 *
 * TODO: review this, should be reversed — a strategy provided at the plugin constructor
 * must override the default strategy from the resolved options
 * (`strategy ?? buildContext.strategy` in `builder/internal-webpack-build.ts`).
 */

export class WebpackWorkboxPWAPlugin<
  S extends Strategy,
  T extends SWType = 'classic',
> {
  static pluginName = 'WebpackWorkboxPWAPlugin'

  #strategy: S
  #options: WorkboxBuildConfiguration<S, T>

  /**
   * @param {Strategy} strategy
   * @param {WorkboxBuildConfiguration} options
   */
  constructor(
    strategy: S,
    options: Partial<WorkboxBuildConfiguration<S, T>> = {},
  ) {
    this.#strategy = strategy
    this.#options = options as WorkboxBuildConfiguration<S, T>
  }

  /**
   * Webpack plugin interface — compatible with Webpack 5.
   * In Webpack 4 the compiler is un-typed, whereas Webpack 5 provides full type definitions.
   */
  apply(compiler: import('webpack').Compiler) {
    const pluginName = WebpackWorkboxPWAPlugin.pluginName

    compiler.hooks.afterEmit.tapPromise(
      pluginName,
      async (compilation: import('webpack').Compilation) => {
        try {
          await this.#executeStrategy(compiler)
        }
        catch (error: any) {
          // Pipes errors cleanly back to the host compiler UI
          compilation.errors.push(error)
        }
      },
    )
  }

  /**
   * Orchestrates the active workflow targeting the Rolldown variants.
   */
  async #executeStrategy(
    compiler: import('webpack').Compiler,
  ) {
    await internalWebpackBuild(
      WebpackWorkboxPWAPlugin.pluginName,
      {
        bundler: 'webpack',
        strategy: this.#strategy,
        cwd: compiler.context,
        // We extract Webpack's configured output directory to use as our globDirectory
        outputPath: compiler.options.output.path,
      },
      this.#options,
    )
  }
}
