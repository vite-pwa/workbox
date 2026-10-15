import { runB } from './b.ts'

export function runC() {
  runB()
  // eslint-disable-next-line no-console
  console.log('runC')
}
