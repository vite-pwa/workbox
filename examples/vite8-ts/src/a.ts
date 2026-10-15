import { runB } from './b.ts'

export function runA() {
  runB()
  // eslint-disable-next-line no-console
  console.log('runA')
}
