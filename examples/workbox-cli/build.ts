import { generateManifestEntries } from '@vite-pwa/workbox-build/utils/generate-manifest-entries'
import { rolldown } from 'rolldown'

async function build() {
  const manifestResult = await generateManifestEntries({
    globIgnores: ['**/{sw,sw-*}.js', '**/*.map'],
    globPatterns: ['**/*.{js,html}'],
  }, './build')
  const instance = await rolldown({
    input: 'build/sw.js',
    platform: 'browser',
    treeshake: true,
    transform: {
      define: {
        'process.env.NODE_ENV': JSON.stringify('production'),
        'self.__WB_MANIFEST': JSON.stringify(manifestResult.manifestEntries),
      },
    },
  })

  const result = await instance.write({
    sourcemap: true,
    // sourcemap: 'inline',
    // sourcemap: 'hidden',
    comments: {
      legal: true,
      jsdoc: false,
      annotation: false,
    },
    // dir: 'build',
    file: 'build/sw-build.js',
    format: 'esm',
    cleanDir: false,
    codeSplitting: false,
  })

  console.log(result.output.map(c => [c.name, c.fileName] as const))
}

build()
