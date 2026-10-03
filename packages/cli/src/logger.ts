import { styleText } from 'node:util'
import { errStyle } from '@vite-pwa/workbox-build/utils/colors'

const infoTag = () => styleText(['cyan', 'bold'], '[Vite PWA]')
const errorTag = () => errStyle(['red', 'bold'], '[Vite PWA]')

export const logger = {
  info: (msg: string) => console.info(`${infoTag()} ${msg}`),
  success: (msg: string) => console.info(`${infoTag()} ${styleText('green', msg)}`),
  error: (msg: string) => console.error(`${errorTag()} ${errStyle('red', msg)}`),
}
