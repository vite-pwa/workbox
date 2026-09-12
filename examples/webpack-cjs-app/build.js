const process = require('node:process')
const webpack = require('webpack')
const config = require('./webpack.config.js')

const compiler = webpack(config)

compiler.run((error, stats) => {
  compiler.close(() => {})

  if (error) {
    console.error(error)
    process.exitCode = 1
    return
  }

  if (stats?.hasErrors()) {
    console.error(stats.toString({ all: false, errors: true }))
    process.exitCode = 1
    return
  }

  console.warn(stats?.toString({
    assets: true,
    colors: true,
    errors: true,
    modules: false,
    timings: true,
    warnings: true,
  }))
})
