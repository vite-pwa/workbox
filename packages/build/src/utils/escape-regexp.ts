// From https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions
const escapeRegex = /[.*+?^${}()|[\]\\]/g
export function escapeRegExp(str: string): string {
  return str.replace(escapeRegex, '\\$&')
}
