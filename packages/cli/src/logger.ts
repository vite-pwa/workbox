import pc from 'picocolors'

const infoTag = pc.cyan(pc.bold('[Vite PWA]'))
const errorTag = pc.red(pc.bold('[Vite PWA]'))

export const logger = {
  info: (msg: string) => console.info(`${infoTag} ${msg}`),
  success: (msg: string) => console.info(`${infoTag} ${pc.green(msg)}`),
  error: (msg: string) => console.error(`${errorTag} ${pc.red(msg)}`),
}
