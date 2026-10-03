import process from 'node:process'
import { styleText as nodeStyleText } from 'node:util'

export type StyleFormat = Parameters<typeof nodeStyleText>[0]

/** For messages written to stderr (console.warn / console.error / thrown errors). */
export function errStyle(format: StyleFormat, text: string) {
  return nodeStyleText(format, text, { stream: process.stderr })
}

// console.warn writes to stderr, so validate colors against that stream
export function warnStyle(format: Parameters<typeof nodeStyleText>[0], text: string) {
  return nodeStyleText(format, text, { stream: process.stderr })
}
