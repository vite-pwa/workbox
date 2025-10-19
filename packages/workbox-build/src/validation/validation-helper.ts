import type { BaseIssue, BaseSchema, IssuePathItem } from 'valibot'
import { getDotPath, safeParse } from 'valibot'

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
  const path = getDotPath(issue)
  const topLevelKey = getTopLevelKey(issue.path)

  // Priority 1: Custom messages from pipes (e.g., endsWith).
  // These are the most specific and should always be shown.
  if (issue.type === 'custom')
    return issue.message

  // Priority 2: Missing required key.
  if (issue.kind === 'schema' && issue.received === 'undefined')
    return `The required option "${path}" is missing.`

  // Priority 3: Unknown key in strict object.
  if (issue.type === 'strict_object')
    return `The option "${path}" is unknown or has been deprecated.`

  // Priority 4: Human-readable message for array-based options
  if (topLevelKey === 'manifestTransforms' || topLevelKey === 'runtimeCaching') {
    // This error happens when the value itself is not an array
    if (issue.expected?.includes('Array'))
      return `The "${topLevelKey}" option must be an array.`

    // This error happens for items within the array
    const index = issue.path?.find(p => p.type === 'array')?.key
    if (topLevelKey === 'manifestTransforms')
      return `Each item in the "manifestTransforms" array must be a function (error at index ${index}).`

    if (topLevelKey === 'runtimeCaching') {
      if (issue.path?.some(p => p.key === 'handler'))
        return `Invalid "handler" option in runtimeCaching[${index}]. Expected one of (string, function, object) but received ${typeof issue.input}.`
      return `Invalid item at index ${index} in the "runtimeCaching" array.`
    }
  }

  // Priority 5: Generic type mismatch for other fields.
  if (issue.kind === 'schema') {
    return `Invalid type for option "${path}". Expected ${issue.expected} but received ${issue.received}.`
  }

  // Fallback for any other unhandled case.
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
