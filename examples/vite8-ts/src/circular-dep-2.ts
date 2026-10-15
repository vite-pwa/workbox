import { circularDepMessage1 } from './circular-dep-1.js'

export const circularDepMessage2 = 'circular dep 2 message'

export function func2() {
  // eslint-disable-next-line no-console
  console.log({ circularDepMessage1, circularDepMessage2 })
}
