import type { BaseIssue, BaseSchema, IssuePathItem } from 'valibot'
import { safeParse } from 'valibot'

// This helper function traverses the issue's path to find the top-level object key
// that contains the error. This is crucial for errors nested inside arrays.
function getTopLevelKey(path: IssuePathItem[] | undefined): string | undefined {
  if (!path || path.length === 0) {
    return undefined
  }
  // The path is ordered from the outside in. The first item is the outermost.
  // Its key is what we need to identify the top-level option.
  return path[0].key as string | undefined
}

// see [Path Key not Available in safeParse](https://github.com/fabian-hiller/valibot/discussions/696).
// custom Valibot's message mapping
function extractIssueMessage(issue: BaseIssue<any>) {
  const topLevelKey = getTopLevelKey(issue.path)
  const lastKey = issue.path?.[issue.path.length - 1]?.key

  // Case 1: Missing required key. The `key` is on the last path item.
  if (issue.received === 'undefined') {
    return `The required option "${lastKey}" is missing.`
  }

  // Case 2: Unknown key in strict object. The `key` is on the last path item.
  if (issue.expected === 'never') {
    return `The option "${lastKey}" is unknown or has been deprecated.`
  }

  // Case 3: Specific, human-friendly message for manifestTransforms
  if (topLevelKey === 'manifestTransforms') {
    // This error happens when the value is not an array (e.g., a function)
    if (issue.expected?.includes('Array')) {
      return 'The "manifestTransforms" option must be an array of functions.'
    }
    // This error happens for items within the array
    return 'Each item in the "manifestTransforms" array must be a function.'
  }

  // Case 3.5: Specific, human-friendly message for swDest endsWith pipe
  if (topLevelKey === 'swDest' && issue.requirement === '.js') {
    return issue.message
  }

  // Case 4: Generic type mismatch for other fields
  if (issue.expected && typeof lastKey === 'string')
    return `Invalid type for option "${lastKey}". Expected ${issue.expected} but received ${typeof issue.input}.`

  // Fallback for our custom pipes (e.g., `endsWith`) and any other unhandled case
  return issue.message
}

/**
 * A wrapper around Valibot's `safeParse` that throws a user-friendly error
 * if validation fails.
 * @param schema The Valibot schema to use.
 * @param options The options object to validate.
 * @param methodName The name of the Workbox method being validated, for context.
 */
export function validate<TSchema extends BaseSchema<any, any, any>>(
  schema: TSchema,
  options: unknown,
  methodName: string,
): void {
  const result = safeParse(schema, options)
  if (!result.success) {
    const errorMessages = result.issues.map(extractIssueMessage)
    throw new Error(
      `${methodName}() options validation failed: \n- ${errorMessages.join('\n- ')}`,
    )
  }
}
