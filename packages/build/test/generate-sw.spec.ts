import type { GenerateSWOptions, SWType } from '../src/types'
import path from 'node:path'
// import { chai } from '@vitest/expect'
// import * as chai from 'chai'
// import chaiAsPromised from 'chai-as-promised'
import { describe, expect, it } from 'vitest'
import { generateSW } from '../src/generate-sw'
import { validateGenerateSW } from '../src/validation/validation-helper'
// import { errors } from '../src/validation/errors'
import { WorkboxConfigError } from '../src/validation/validation-options'

// chai.use(chaiAsPromised)

describe.skip(`[workbox-build] generate-sw.js (End to End)`, () => {
  const GLOB_DIR = path.resolve(import.meta.dirname, 'fixtures/fixture-generate-sw')
  const BASE_OPTIONS = {
    globDirectory: GLOB_DIR,
    inlineWorkboxRuntime: false,
    mode: 'development',
    swDest: 'sw.js',
  } satisfies GenerateSWOptions<any>
  const REQUIRED_PARAMS = ['swDest']
  const SUPPORTED_PARAMS = [
    'additionalManifestEntries',
    'babelPresetEnvTargets',
    'cacheId',
    'classicWorkboxRuntimeCompatible',
    'clientsClaim',
    'directoryIndex',
    'disableDevLogs',
    'dontCacheBustURLsMatching',
    'globDirectory',
    'globFollow',
    'globIgnores',
    'globPatterns',
    'globStrict',
    'ignoreURLParametersMatching',
    'importScripts',
    'inlineWorkboxRuntime',
    'manifestTransforms',
    'maximumFileSizeToCacheInBytes',
    'mode',
    'modifyURLPrefix',
    'navigateFallback',
    'navigateFallbackDenylist',
    'navigateFallbackAllowlist',
    'navigationPreload',
    'offlineGoogleAnalytics',
    'runtimeCaching',
    'skipWaiting',
    'swType',
    'sourcemap',
    'templatedURLs',
  ].concat(REQUIRED_PARAMS)
  const UNSUPPORTED_PARAMS = ['injectionPoint', 'swSrc']
  const PRECACHE_ORDER = [
    {
      url: 'webpackEntry.js',
      revision: /^[0-9a-f]{32}$/,
    },
    {
      url: 'page-2.html',
      revision: /^[0-9a-f]{32}$/,
    },
    {
      url: 'page-1.html',
      revision: /^[0-9a-f]{32}$/,
    },
    {
      url: 'index.html',
      revision: /^[0-9a-f]{32}$/,
    },
    {
      url: 'styles/stylesheet-2.css',
      revision: /^[0-9a-f]{32}$/,
    },
    {
      url: 'styles/stylesheet-1.css',
      revision: /^[0-9a-f]{32}$/,
    },
  ]

  describe('[workbox-build] required parameters', () => {
    for (const requiredParam of REQUIRED_PARAMS) {
      it(`should fail validation when '${requiredParam}' is missing`, async () => {
        const options = Object.assign({}, BASE_OPTIONS) as GenerateSWOptions<SWType>
        delete options[requiredParam as keyof typeof options]

        await expect(validateGenerateSW(options)).to.eventually.be.rejectedWith(
          WorkboxConfigError,
          requiredParam,
        )
      })
    }
  })

  describe('[workbox-build] unsupported parameters', () => {
    for (const unsupportedParam of UNSUPPORTED_PARAMS) {
      it(`should fail validation when '${unsupportedParam}' is present`, async () => {
        const options = Object.assign({}, BASE_OPTIONS) as any
        options[unsupportedParam] = unsupportedParam

        await expect(validateGenerateSW(options)).to.eventually.be.rejectedWith(
          WorkboxConfigError,
          unsupportedParam,
        )
      })
    }
  })

  describe.only('[workbox-build] invalid parameter values', () => {
    /* for (const param of SUPPORTED_PARAMS) {
      it(`should fail validation when '${param}' is an unexpected value`, async () => {
        const options = Object.assign({}, BASE_OPTIONS) as any
        options[param] = () => {}

        await expect(validateGenerateSW(options)).to.eventually.be.rejectedWith(
          WorkboxConfigError,
          param,
        )
      })
    } */

    it(`should reject when there are no manifest entries or runtimeCaching`, async () => {
      const options = Object.assign({}, BASE_OPTIONS) as GenerateSWOptions<SWType>
      options.globStrict = true
      // This temporary directory will be empty.
      options.globDirectory = path.resolve(import.meta.dirname, 'fixtures/empty-fixture')

      /* try {
        await generateSW(options)
      }
      catch (e) {
        console.error('WTF', e)
      } */
      await expect(generateSW(options)).rejects.toThrowErrorMatchingInlineSnapshot(`
        [Error: 
        [31m[1m[Vite PWA][22m[39m [31mOne of the glob patterns doesn't match any files:[39m
          - **/*.{js,css,html}
        [1mTo resolve this issue, you can either:[22m
          1. Disable [32m"globStrict"[39m to convert this error into a warning.
          2. Remove/Update previous patterns from [32m"globPatterns"[39m.

        ]
      `)
    })
  })

  /* describe(`[workbox-build] writing a service worker file`, () => {
    it(`should use defaults when all the required parameters are present`, async () => {
      const outputDir = tempy.directory()
      const swDest = upath.join(outputDir, 'sw.js')
      const options = Object.assign({}, BASE_OPTIONS, { swDest })

      const { count, filePaths, size, warnings } = await generateSW(options)
      expect(warnings).toHaveLength(0)
      expect(count).to.eql(6)
      // Line ending differences lead to different sizes on Windows.
      expect(size).to.be.oneOf([2782, 2698])

      await confirmDirectoryContains(outputDir, filePaths)

      await validateServiceWorkerRuntime({
        swFile: swDest,
        expectedMethodCalls: {
          __WB_DISABLE_DEV_LOGS: undefined,
          importScripts: [[/^\.\/workbox-[0-9a-f]{8}$/]],
          precacheAndRoute: [[PRECACHE_ORDER, {}]],
        },
      })
    })

    it(`should include the versioning strings in the generated bundle`, async () => {
      const outputDir = tempy.directory()
      const swDest = upath.join(outputDir, 'sw.js')
      const options = Object.assign({}, BASE_OPTIONS, {
        swDest,
        inlineWorkboxRuntime: true,
      })

      const { count, warnings } = await generateSW(options)
      expect(warnings).toHaveLength(0)
      expect(count).to.eql(6)

      const contents = await fse.readFile(swDest, 'utf8')
      // This isn't the exact string, but it's close enough.
      expect(contents).to.include(`workbox:core:`)
    })

    it(`should disable logging when disableDevLogs is set to true`, async () => {
      const outputDir = tempy.directory()
      const swDest = upath.join(outputDir, 'sw.js')
      const options = Object.assign({}, BASE_OPTIONS, {
        disableDevLogs: true,
        swDest,
      })

      const { count, filePaths, size, warnings } = await generateSW(options)
      expect(warnings).toHaveLength(0)
      expect(count).to.eql(6)
      // Line ending differences lead to different sizes on Windows.
      expect(size).to.be.oneOf([2782, 2698])

      await confirmDirectoryContains(outputDir, filePaths)

      await validateServiceWorkerRuntime({
        swFile: swDest,
        expectedMethodCalls: {
          __WB_DISABLE_DEV_LOGS: true,
          importScripts: [[/^\.\/workbox-[0-9a-f]{8}$/]],
          precacheAndRoute: [[PRECACHE_ORDER, {}]],
        },
      })
    })

    it(`should use defaults when all the required parameters are present, with additional importScripts`, async () => {
      const outputDir = tempy.directory()
      const swDest = upath.join(outputDir, 'sw.js')
      const importScripts = ['manifest.js']
      const options = Object.assign({}, BASE_OPTIONS, {
        importScripts,
        swDest,
      })

      const { count, filePaths, size, warnings } = await generateSW(options)
      expect(warnings).toHaveLength(0)
      expect(count).to.eql(6)
      // Line ending differences lead to different sizes on Windows.
      expect(size).to.be.oneOf([2782, 2698])

      await confirmDirectoryContains(outputDir, filePaths)

      await validateServiceWorkerRuntime({
        swFile: swDest,
        expectedMethodCalls: {
          importScripts: [[/^\.\/workbox-[0-9a-f]{8}$/], [...importScripts]],
          precacheAndRoute: [[PRECACHE_ORDER, {}]],
        },
      })
    })

    it(`should use defaults when all the required parameters are present, with additional configuration`, async () => {
      const outputDir = tempy.directory()
      const swDest = upath.join(outputDir, 'sw.js')
      const directoryIndex = 'test.html'
      const ignoreURLParametersMatching = [/test1/, /test2/]
      const cacheId = 'test'
      const additionalOptions = {
        cacheId,
        directoryIndex,
        ignoreURLParametersMatching,
        clientsClaim: true,
        skipWaiting: true,
      }
      const options = Object.assign({}, BASE_OPTIONS, additionalOptions, {
        swDest,
      })

      const { count, filePaths, size, warnings } = await generateSW(options)
      expect(warnings).toHaveLength(0)
      expect(count).to.eql(6)
      // Line ending differences lead to different sizes on Windows.
      expect(size).to.be.oneOf([2782, 2698])

      await confirmDirectoryContains(outputDir, filePaths)

      await validateServiceWorkerRuntime({
        swFile: swDest,
        expectedMethodCalls: {
          importScripts: [[/^\.\/workbox-[0-9a-f]{8}$/]],
          clientsClaim: [[]],
          skipWaiting: [[]],
          setCacheNameDetails: [[{ prefix: cacheId }]],
          precacheAndRoute: [
            [PRECACHE_ORDER, { directoryIndex, ignoreURLParametersMatching }],
          ],
        },
        addEventListenerValidation: (addEventListenerStub) => {
          // When skipWaiting is true, the 'message' addEventListener shouldn't be called.
          expect(addEventListenerStub.called).to.be.false
        },
      })
    })

    it(`should use defaults when all the required parameters are present, with additionalManifestEntries`, async () => {
      const outputDir = tempy.directory()
      const swDest = upath.join(outputDir, 'sw.js')
      const options = Object.assign({}, BASE_OPTIONS, {
        additionalManifestEntries: [
          '/one',
          { url: '/two', revision: null },
          { url: '/three', revision: '333' },
          // See https://github.com/GoogleChrome/workbox/issues/2558
          { url: '/four', revision: '123', integrity: '456' },
        ],
        swDest,
      })

      const { count, filePaths, size, warnings } = await generateSW(options)
      // The string additionalManifestEntries entry should lead to one warning.
      expect(warnings).to.have.length(1)
      expect(count).to.eql(10)
      // Line ending differences lead to different sizes on Windows.
      expect(size).to.be.oneOf([2782, 2698])

      await confirmDirectoryContains(outputDir, filePaths)

      await validateServiceWorkerRuntime({
        swFile: swDest,
        expectedMethodCalls: {
          importScripts: [[/^\.\/workbox-[0-9a-f]{8}$/]],
          precacheAndRoute: [
            [
              [
                ...PRECACHE_ORDER,
                { url: '/one', revision: null },
                { url: '/two', revision: null },
                { url: '/three', revision: '333' },
                { url: '/four', revision: '123', integrity: '456' },
              ],
              {},
            ],
          ],
        },
      })
    })

    it(`should add a 'message' event listener when 'skipWaiting: false'`, async () => {
      const outputDir = tempy.directory()
      const swDest = upath.join(outputDir, 'sw.js')
      const additionalOptions = {
        skipWaiting: false,
      }
      const options = Object.assign({}, BASE_OPTIONS, additionalOptions, {
        swDest,
      })

      const { count, filePaths, size, warnings } = await generateSW(options)
      expect(warnings).toHaveLength(0)
      expect(count).to.eql(6)
      // Line ending differences lead to different sizes on Windows.
      expect(size).to.be.oneOf([2782, 2698])

      await confirmDirectoryContains(outputDir, filePaths)

      await validateServiceWorkerRuntime({
        swFile: swDest,
        expectedMethodCalls: {
          importScripts: [[/^\.\/workbox-[0-9a-f]{8}$/]],
          precacheAndRoute: [[PRECACHE_ORDER, {}]],
        },
        addEventListenerValidation: (addEventListenerStub) => {
          expect(addEventListenerStub.calledOnce).to.be.true
          expect(addEventListenerStub.firstCall.args[0]).to.eql('message')
          // This isn't the *cleanest* possible way of testing the message event
          // handler, but given the constraints of this node-based environment,
          // it seems the most effective way to ensure the right code gets run.
          expect(addEventListenerStub.firstCall.args[1].toString()).to.eql(
            `event => {\n    if (event.data && event.data.type === 'SKIP_WAITING') {\n      self.skipWaiting();\n    }\n  }`,
          )
        },
      })
    })

    it(`should use defaults when all the required parameters are present, with 'navigateFallback'`, async () => {
      const outputDir = tempy.directory()
      const swDest = upath.join(outputDir, 'sw.js')
      const navigateFallback = 'test.html'
      const navigateFallbackDenylist = [/test1/, /test2/]
      const navigateFallbackAllowlist = [/test3/, /test4/]
      const options = Object.assign({}, BASE_OPTIONS, {
        navigateFallback,
        navigateFallbackDenylist,
        navigateFallbackAllowlist,
        swDest,
      })

      const { count, filePaths, size, warnings } = await generateSW(options)
      expect(warnings).toHaveLength(0)
      expect(count).to.eql(6)
      // Line ending differences lead to different sizes on Windows.
      expect(size).to.be.oneOf([2782, 2698])

      await confirmDirectoryContains(outputDir, filePaths)

      await validateServiceWorkerRuntime({
        swFile: swDest,
        expectedMethodCalls: {
          createHandlerBoundToURL: [[navigateFallback]],
          importScripts: [[/^\.\/workbox-[0-9a-f]{8}$/]],
          precacheAndRoute: [[PRECACHE_ORDER, {}]],
          registerRoute: [[{ name: 'NavigationRoute' }]],
          NavigationRoute: [
            [
              '/urlWithCacheKey',
              {
                denylist: navigateFallbackDenylist,
                allowlist: navigateFallbackAllowlist,
              },
            ],
          ],
        },
      })
    })

    it(`should use defaults when all the required parameters are present, with symlinks`, async () => {
      const outputDir = tempy.directory()
      const swDest = upath.join(outputDir, 'sw.js')
      const globDirectory = tempy.directory()

      await fse.ensureSymlink(GLOB_DIR, upath.join(globDirectory, 'link'))

      const options = Object.assign({}, BASE_OPTIONS, {
        globDirectory,
        swDest,
      })

      const { count, filePaths, size, warnings } = await generateSW(options)
      expect(warnings).toHaveLength(0)
      expect(count).to.eql(6)
      // Line ending differences lead to different sizes on Windows.
      expect(size).to.be.oneOf([2782, 2698])

      await confirmDirectoryContains(outputDir, filePaths)

      await validateServiceWorkerRuntime({
        swFile: swDest,
        expectedMethodCalls: {
          importScripts: [[/^\.\/workbox-[0-9a-f]{8}$/]],
          precacheAndRoute: [
            [
              [
                {
                  url: 'link/webpackEntry.js',
                  revision: /^[0-9a-f]{32}$/,
                },
                {
                  url: 'link/page-2.html',
                  revision: /^[0-9a-f]{32}$/,
                },
                {
                  url: 'link/page-1.html',
                  revision: /^[0-9a-f]{32}$/,
                },
                {
                  url: 'link/index.html',
                  revision: /^[0-9a-f]{32}$/,
                },
                {
                  url: 'link/styles/stylesheet-2.css',
                  revision: /^[0-9a-f]{32}$/,
                },
                {
                  url: 'link/styles/stylesheet-1.css',
                  revision: /^[0-9a-f]{32}$/,
                },
              ],
              {},
            ],
          ],
        },
      })
    })

    it(`should use defaults when all the required parameters are present, with 'globFollow:true' and  symlinks`, async () => {
      // https://github.com/isaacs/node-glob/blob/main/changelog.md#90
      // 10.3 exclude symbolic links to directories when follow and nodir are both set

      const outputDir = tempy.directory()
      const swDest = upath.join(outputDir, 'sw.js')
      const globDirectory = tempy.directory()

      await fse.ensureSymlink(GLOB_DIR, upath.join(globDirectory, 'link'))

      const options = Object.assign({}, BASE_OPTIONS, {
        globDirectory,
        globFollow: true,
        swDest,
      })

      const { count, filePaths, size, warnings } = await generateSW(options)
      expect(warnings).toHaveLength(0)
      expect(count).to.eql(6)
      // Line ending differences lead to different sizes on Windows.
      expect(size).to.be.oneOf([2782, 2698])

      await confirmDirectoryContains(outputDir, filePaths)

      await validateServiceWorkerRuntime({
        swFile: swDest,
        expectedMethodCalls: {
          importScripts: [[/^\.\/workbox-[0-9a-f]{8}$/]],
          precacheAndRoute: [
            [
              [
                {
                  url: 'link/webpackEntry.js',
                  revision: /^[0-9a-f]{32}$/,
                },
                {
                  url: 'link/page-2.html',
                  revision: /^[0-9a-f]{32}$/,
                },
                {
                  url: 'link/page-1.html',
                  revision: /^[0-9a-f]{32}$/,
                },
                {
                  url: 'link/index.html',
                  revision: /^[0-9a-f]{32}$/,
                },
                {
                  url: 'link/styles/stylesheet-2.css',
                  revision: /^[0-9a-f]{32}$/,
                },
                {
                  url: 'link/styles/stylesheet-1.css',
                  revision: /^[0-9a-f]{32}$/,
                },
              ],
              {},
            ],
          ],
        },
      })
    })

    it(`should use defaults when all the required parameters are present, with 'offlineGoogleAnalytics' set to true`, async () => {
      const outputDir = tempy.directory()
      const swDest = upath.join(outputDir, 'sw.js')
      const options = Object.assign({}, BASE_OPTIONS, {
        swDest,
        offlineGoogleAnalytics: true,
      })

      const { count, filePaths, size, warnings } = await generateSW(options)
      expect(warnings).toHaveLength(0)
      expect(count).to.eql(6)
      // Line ending differences lead to different sizes on Windows.
      expect(size).to.be.oneOf([2782, 2698])

      await confirmDirectoryContains(outputDir, filePaths)

      await validateServiceWorkerRuntime({
        swFile: swDest,
        expectedMethodCalls: {
          importScripts: [[/^\.\/workbox-[0-9a-f]{8}$/]],
          precacheAndRoute: [[PRECACHE_ORDER, {}]],
          initialize: [[{}]],
        },
      })
    })

    it(`should use defaults when all the required parameters are present, with 'offlineGoogleAnalytics' set to a config`, async () => {
      const outputDir = tempy.directory()
      const swDest = upath.join(outputDir, 'sw.js')
      const options = Object.assign({}, BASE_OPTIONS, {
        swDest,
        offlineGoogleAnalytics: {
          parameterOverrides: {
            cd1: 'offline',
          },
        },
      })

      const { count, filePaths, size, warnings } = await generateSW(options)
      expect(warnings).toHaveLength(0)
      expect(count).to.eql(6)
      // Line ending differences lead to different sizes on Windows.
      expect(size).to.be.oneOf([2782, 2698])

      await confirmDirectoryContains(outputDir, filePaths)

      await validateServiceWorkerRuntime({
        swFile: swDest,
        expectedMethodCalls: {
          importScripts: [[/^\.\/workbox-[0-9a-f]{8}$/]],
          precacheAndRoute: [[PRECACHE_ORDER, {}]],
          initialize: [
            [
              {
                parameterOverrides: {
                  cd1: 'offline',
                },
              },
            ],
          ],
        },
      })
    })

    it(`should support using a swDest that includes a subdirectory`, async () => {
      const outputDir = tempy.directory()
      const swDest = upath.join(outputDir, 'sub', 'directory', 'sw.js')
      const options = Object.assign({}, BASE_OPTIONS, {
        swDest,
      })

      const { count, filePaths, size, warnings } = await generateSW(options)
      expect(warnings).toHaveLength(0)
      expect(count).to.eql(6)
      // Line ending differences lead to different sizes on Windows.
      expect(size).to.be.oneOf([2782, 2698])

      await confirmDirectoryContains(outputDir, filePaths)
    })

    it(`should inline the Workbox runtime when 'inlineWorkboxRuntime' is true`, async () => {
      const outputDir = tempy.directory()
      const swDest = upath.join(outputDir, 'sw.js')
      const options = Object.assign({}, BASE_OPTIONS, {
        swDest,
        inlineWorkboxRuntime: true,
      })

      const { count, filePaths, size, warnings } = await generateSW(options)
      expect(warnings).toHaveLength(0)
      expect(count).to.eql(6)
      // Line ending differences lead to different sizes on Windows.
      expect(size).to.be.oneOf([2782, 2698])

      await confirmDirectoryContains(outputDir, filePaths)
      // We can't validate the generated sw.js file, unfortunately.
    })
  })

  describe(`[workbox-build] behavior with 'runtimeCaching'`, () => {
    const DEFAULT_METHOD = 'GET'
    const REGEXP_URL_PATTERN = /test/
    const STRING_URL_PATTERN = '/test'
    const STRING_HANDLER = 'CacheFirst'
    const FUNCTION_URL_PATTERN = params => true

    it(`should reject when 'urlPattern' is missing from 'runtimeCaching'`, async () => {
      const handler = STRING_HANDLER
      const options = Object.assign({}, BASE_OPTIONS, {
        runtimeCaching: [{ handler }],
      })

      await expect(generateSW(options)).to.eventually.be.rejectedWith(
        WorkboxConfigError,
        'urlPattern',
      )
    })

    it(`should reject when 'handler' is missing from 'runtimeCaching'`, async () => {
      const urlPattern = REGEXP_URL_PATTERN
      const options = Object.assign({}, BASE_OPTIONS, {
        runtimeCaching: [{ urlPattern }],
      })

      await expect(generateSW(options)).to.eventually.be.rejectedWith(
        WorkboxConfigError,
        'handler',
      )
    })

    it(`should reject when 'handler' is not a valid strategy name`, async () => {
      const urlPattern = REGEXP_URL_PATTERN
      const options = Object.assign({}, BASE_OPTIONS, {
        runtimeCaching: [
          {
            urlPattern,
            handler: 'invalid',
          },
        ],
      })

      await expect(generateSW(options)).to.eventually.be.rejectedWith(
        WorkboxConfigError,
        'handler',
      )
    })

    // See https://github.com/GoogleChrome/workbox/issues/2078
    it(`should not require using precaching`, async () => {
      const swDest = tempy.file({ extension: 'js' })
      const runtimeCaching = [
        {
          urlPattern: STRING_URL_PATTERN,
          handler: STRING_HANDLER,
        },
      ]
      const options = Object.assign({}, BASE_OPTIONS, {
        runtimeCaching,
        swDest,
      })
      delete options.globDirectory

      const { count, size, warnings } = await generateSW(options)
      expect(warnings).toHaveLength(0)
      expect(count).to.eql(0)
      expect(size).to.eql(0)
      await validateServiceWorkerRuntime({
        swFile: swDest,
        expectedMethodCalls: {
          [STRING_HANDLER]: [[]],
          importScripts: [[/^\.\/workbox-[0-9a-f]{8}$/]],
          registerRoute: [
            [STRING_URL_PATTERN, { name: STRING_HANDLER }, DEFAULT_METHOD],
          ],
        },
      })
    })

    it(`should support a single string 'urlPattern' and a string 'handler'`, async () => {
      const swDest = tempy.file({ extension: 'js' })
      const runtimeCaching = [
        {
          urlPattern: STRING_URL_PATTERN,
          handler: STRING_HANDLER,
        },
      ]
      const options = Object.assign({}, BASE_OPTIONS, {
        runtimeCaching,
        swDest,
      })

      const { count, size, warnings } = await generateSW(options)
      expect(warnings).toHaveLength(0)
      expect(count).to.eql(6)
      // Line ending differences lead to different sizes on Windows.
      expect(size).to.be.oneOf([2782, 2698])
      await validateServiceWorkerRuntime({
        swFile: swDest,
        expectedMethodCalls: {
          [STRING_HANDLER]: [[]],
          importScripts: [[/^\.\/workbox-[0-9a-f]{8}$/]],
          precacheAndRoute: [[PRECACHE_ORDER, {}]],
          registerRoute: [
            [STRING_URL_PATTERN, { name: STRING_HANDLER }, DEFAULT_METHOD],
          ],
        },
      })
    })

    it(`should support a single function 'urlPattern' and a string 'handler'`, async () => {
      const swDest = tempy.file({ extension: 'js' })
      const runtimeCaching = [
        {
          urlPattern: FUNCTION_URL_PATTERN,
          handler: STRING_HANDLER,
        },
      ]
      const options = Object.assign({}, BASE_OPTIONS, {
        runtimeCaching,
        swDest,
      })

      const { count, size, warnings } = await generateSW(options)
      expect(warnings).toHaveLength(0)
      expect(count).to.eql(6)
      // Line ending differences lead to different sizes on Windows.
      expect(size).to.be.oneOf([2782, 2698])
      await validateServiceWorkerRuntime({
        swFile: swDest,
        expectedMethodCalls: {
          [STRING_HANDLER]: [[]],
          importScripts: [[/^\.\/workbox-[0-9a-f]{8}$/]],
          precacheAndRoute: [[PRECACHE_ORDER, {}]],
          // See https://github.com/chaijs/chai/issues/697
          registerRoute: [
            ['params => true', { name: STRING_HANDLER }, DEFAULT_METHOD],
          ],
        },
      })
    })

    it(`should support setting individual 'options' each, for multiple 'runtimeCaching' entries`, async () => {
      const swDest = tempy.file({ extension: 'js' })
      const firstRuntimeCachingOptions = {
        cacheName: 'first-cache-name',
        expiration: {
          maxEntries: 1,
          maxAgeSeconds: 1,
          purgeOnQuotaError: false,
        },
      }
      const secondRuntimeCachingOptions = {
        cacheName: 'second-cache-name',
        cacheableResponse: {
          headers: {
            'X-Test': 'test',
          },
          statuses: [0, 200],
        },
        precacheFallback: {
          fallbackURL: '/test',
        },
      }
      const runtimeCaching = [
        {
          urlPattern: REGEXP_URL_PATTERN,
          handler: STRING_HANDLER,
          options: firstRuntimeCachingOptions,
        },
        {
          urlPattern: REGEXP_URL_PATTERN,
          handler: STRING_HANDLER,
          options: secondRuntimeCachingOptions,
        },
      ]
      const options = Object.assign({}, BASE_OPTIONS, {
        runtimeCaching,
        swDest,
      })

      const { count, size, warnings } = await generateSW(options)

      expect(warnings).toHaveLength(0)
      expect(count).to.eql(6)
      // Line ending differences lead to different sizes on Windows.
      expect(size).to.be.oneOf([2782, 2698])

      await validateServiceWorkerRuntime({
        swFile: swDest,
        expectedMethodCalls: {
          [STRING_HANDLER]: [
            [
              {
                cacheName: firstRuntimeCachingOptions.cacheName,
                plugins: [{}],
              },
            ],
            [
              {
                cacheName: secondRuntimeCachingOptions.cacheName,
                plugins: [{}, {}],
              },
            ],
          ],
          ExpirationPlugin: [[firstRuntimeCachingOptions.expiration]],
          CacheableResponsePlugin: [
            [secondRuntimeCachingOptions.cacheableResponse],
          ],
          PrecacheFallbackPlugin: [
            [secondRuntimeCachingOptions.precacheFallback],
          ],
          importScripts: [[/^\.\/workbox-[0-9a-f]{8}$/]],
          precacheAndRoute: [[PRECACHE_ORDER, {}]],
          registerRoute: [
            [REGEXP_URL_PATTERN, { name: STRING_HANDLER }, DEFAULT_METHOD],
            [REGEXP_URL_PATTERN, { name: STRING_HANDLER }, DEFAULT_METHOD],
          ],
        },
      })
    })

    it(`should reject with a ValidationError when 'networkTimeoutSeconds' is used and handler is not 'NetworkFirst'`, async () => {
      const swDest = tempy.file({ extension: 'js' })
      const runtimeCachingOptions = {
        networkTimeoutSeconds: 1,
      }
      const runtimeCaching = [
        {
          urlPattern: REGEXP_URL_PATTERN,
          handler: 'NetworkOnly',
          options: runtimeCachingOptions,
        },
      ]
      const options = Object.assign({}, BASE_OPTIONS, {
        runtimeCaching,
        swDest,
      })

      await expect(generateSW(options)).to.eventually.be.rejectedWith(
        errors['invalid-network-timeout-seconds'],
      )
    })

    it(`should support passing in a function when allowed`, async () => {
      const swDest = tempy.file({ extension: 'js' })
      const handler = () => {}
      const urlPattern = () => {}

      const runtimeCachingOptions = {
        backgroundSync: {
          name: 'test',
          options: {
            onSync: () => {},
          },
        },
        plugins: [
          {
            cachedResponseWillBeUsed: () => {},
          },
        ],
      }
      const runtimeCaching = [
        {
          handler,
          urlPattern,
          options: runtimeCachingOptions,
        },
      ]
      const options = Object.assign({}, BASE_OPTIONS, {
        runtimeCaching,
        swDest,
      })

      const { count, size, warnings } = await generateSW(options)
      expect(warnings).toHaveLength(0)
      expect(count).to.eql(6)
      // Line ending differences lead to different sizes on Windows.
      expect(size).to.be.oneOf([2782, 2698])
      await validateServiceWorkerRuntime({
        swFile: swDest,
        expectedMethodCalls: {
          [handler]: [[runtimeCachingOptions]],
          importScripts: [[/^\.\/workbox-[0-9a-f]{8}$/]],
          precacheAndRoute: [[PRECACHE_ORDER, {}]],
          registerRoute: [
            [urlPattern.toString(), handler.toString(), DEFAULT_METHOD],
          ],
        },
      })
    })

    it(`should support 'networkTimeoutSeconds' when handler is 'NetworkFirst'`, async () => {
      const swDest = tempy.file({ extension: 'js' })
      const networkTimeoutSeconds = 1
      const handler = 'NetworkFirst'

      const runtimeCachingOptions = {
        networkTimeoutSeconds,
        plugins: [],
      }
      const runtimeCaching = [
        {
          urlPattern: REGEXP_URL_PATTERN,
          handler,
          options: runtimeCachingOptions,
        },
      ]
      const options = Object.assign({}, BASE_OPTIONS, {
        runtimeCaching,
        swDest,
      })

      const { count, size, warnings } = await generateSW(options)
      expect(warnings).toHaveLength(0)
      expect(count).to.eql(6)
      // Line ending differences lead to different sizes on Windows.
      expect(size).to.be.oneOf([2782, 2698])
      await validateServiceWorkerRuntime({
        swFile: swDest,
        expectedMethodCalls: {
          [handler]: [[runtimeCachingOptions]],
          importScripts: [[/^\.\/workbox-[0-9a-f]{8}$/]],
          precacheAndRoute: [[PRECACHE_ORDER, {}]],
          registerRoute: [
            [REGEXP_URL_PATTERN, { name: handler }, DEFAULT_METHOD],
          ],
        },
      })
    })

    it(`should reject when 'options.expiration' is used without 'options.cacheName'`, async () => {
      const urlPattern = REGEXP_URL_PATTERN
      const options = Object.assign({}, BASE_OPTIONS, {
        runtimeCaching: [
          {
            urlPattern,
            handler: 'NetworkFirst',
            options: {
              expiration: {
                maxEntries: 5,
              },
            },
          },
        ],
      })

      await expect(generateSW(options)).to.eventually.be.rejectedWith(
        WorkboxConfigError,
        errors['cache-name-required'],
      )
    })

    it(`should ignore swDest and workbox-*.js when generating manifest entries`, async () => {
      const tempDirectory = tempy.directory()
      await fse.copy(BASE_OPTIONS.globDirectory, tempDirectory)
      const swDest = upath.join(tempDirectory, 'service-worker.js')
      await fse.createFile(swDest)
      // See https://rollupjs.org/guide/en/#outputchunkfilenames
      await fse.createFile(upath.join(tempDirectory, 'workbox-abcd1234.js'))
      const options = Object.assign({}, BASE_OPTIONS, {
        globDirectory: tempDirectory,
        swDest,
      })

      const { count, size, warnings } = await generateSW(options)
      expect(warnings).toHaveLength(0)
      expect(count).to.eql(6)
      // Line ending differences lead to different sizes on Windows.
      expect(size).to.be.oneOf([2782, 2698])
      await validateServiceWorkerRuntime({
        swFile: swDest,
        expectedMethodCalls: {
          importScripts: [[/^\.\/workbox-[0-9a-f]{8}$/]],
          precacheAndRoute: [[PRECACHE_ORDER, {}]],
        },
      })
    })
  })

  describe(`[workbox-build] behavior with 'navigationPreload'`, () => {
    it(`should reject when 'navigationPreload' is true and 'runtimeCaching' is undefined`, async () => {
      const options = Object.assign({}, BASE_OPTIONS, {
        navigationPreload: true,
      })

      await expect(generateSW(options)).to.eventually.be.rejectedWith(
        WorkboxConfigError,
        errors['nav-preload-runtime-caching'],
      )
    })

    it(`should reject when 'navigationPreload' is true and 'runtimeCaching' is undefined`, async () => {
      const options = Object.assign({}, BASE_OPTIONS, {
        runtimeCaching: undefined,
        navigationPreload: true,
      })

      await expect(generateSW(options)).to.eventually.be.rejectedWith(
        WorkboxConfigError,
        errors['nav-preload-runtime-caching'],
      )
    })

    it(`should generate when 'navigationPreload' is true and 'runtimeCaching' is valid`, async () => {
      const swDest = tempy.file({ extension: 'js' })
      const urlPattern = /test/
      const handler = 'CacheFirst'
      const options = Object.assign({}, BASE_OPTIONS, {
        swDest,
        runtimeCaching: [{ urlPattern, handler }],
        navigationPreload: true,
      })

      const { count, size, warnings } = await generateSW(options)
      expect(warnings).toHaveLength(0)
      expect(count).to.eql(6)
      // Line ending differences lead to different sizes on Windows.
      expect(size).to.be.oneOf([2782, 2698])
      await validateServiceWorkerRuntime({
        swFile: swDest,
        expectedMethodCalls: {
          [handler]: [[]],
          importScripts: [[/^\.\/workbox-[0-9a-f]{8}$/]],
          precacheAndRoute: [[PRECACHE_ORDER, {}]],
          enable: [[]],
          registerRoute: [[urlPattern, { name: handler }, 'GET']],
        },
      })
    })
  }) */
})
