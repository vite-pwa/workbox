import { circularDepMessage2 } from './circular-dep-2.js'

export const circularDepMessage1 = 'circular dep 1 message'

export function func1() {
  // eslint-disable-next-line no-console
  console.log({ circularDepMessage1, circularDepMessage2 })
}
