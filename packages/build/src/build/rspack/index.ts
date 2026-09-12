import type { Strategy, WorkboxBuildConfiguration } from '../../config/types'
import type { SWType } from '../../types'
import { internalWebpackBuild } from '../builder/internal-webpack-build'

/**
 * [rspack plugin](https://rspack.rs/plugins/) for Workbox build strategies.
 * **WARNING**: strategy from the resolved options will override the strategy used in the plugin constructor.
 *
 * TODO: review this, should be reversed — a strategy provided at the plugin constructor
 * must override the default strategy from the resolved options
 * (`strategy ?? buildContext.strategy` in `builder/internal-webpack-build.ts`).
 */
export class RspackWorkboxPWAPlugin<
  S extends Strategy,
  T extends SWType = 'classic',
> {
  static pluginName = 'RspackWorkboxPWAPlugin'

  #strategy: S
  #options: WorkboxBuildConfiguration<S, T>

  constructor(
    strategy: S,
    options: Partial<WorkboxBuildConfiguration<S, T>> = {},
  ) {
    this.#strategy = strategy
    this.#options = options as WorkboxBuildConfiguration<S, T>
  }

  /**
   * Rspack plugin interface.
   * Hooks into 'afterEmit' to guarantee that Rspack has finished writing
   * the host application files to disk before we run our Rolldown compiler.
   */
  apply(compiler: import('@rspack/core').Compiler) {
    const pluginName = RspackWorkboxPWAPlugin.pluginName

    // Rspack implements the exact same tapPromise 'afterEmit' hook as Webpack in Rust
    compiler.hooks.afterEmit.tapPromise(
      pluginName,
      async (compilation: import('@rspack/core').Compilation) => {
        try {
          await this.#executeStrategy(compiler)
        }
        catch (error: any) {
          // Pipes any async errors back to the Rspack CLI console UI
          compilation.errors.push(error)
        }
      },
    )
  }

  /**
   * Triggers your internal, custom Rolldown compilation workflows.
   */
  async #executeStrategy(compiler: import('@rspack/core').Compiler) {
    await internalWebpackBuild(
      RspackWorkboxPWAPlugin.pluginName,
      {
        bundler: 'rspack',
        strategy: this.#strategy,
        cwd: compiler.context,
        // We extract Rspack's configured output directory to use as our globDirectory
        outputPath: compiler.options.output.path,
      },
      this.#options,
    )
  }
}
