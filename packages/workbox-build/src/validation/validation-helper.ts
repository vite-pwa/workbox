// import type { ArrayExpression, Program } from '@babel/types'
import type { BaseIssue, BaseSchemaAsync, InferOutput, IssuePathItem } from 'valibot'
import { getDotPath, safeParseAsync } from 'valibot'

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
  // console.log(issue)
  const path = getDotPath(issue)
  const topLevelKey = getTopLevelKey(issue.path)
  const lastKey = issue.path?.[issue.path.length - 1]?.key

  // Priority 1: Custom messages from pipes (e.g., endsWith).
  // These are the most specific and should always be shown.
  if (issue.type === 'custom') {
    // handle NumericExpressionSchema from utils.ts
    if (issue.message === 'invalid-number-entry-or-expression') {
      return `The option "${path}" must be a number or a valid numeric expression (e.g., 60 * 60).`
    }

    return issue.message
  }

  // Priority 2: Missing required key.
  if (issue.kind === 'schema' && issue.received === 'undefined') {
    return `The option "${path}" is required.`
  }

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
      // This error happens when the value is not an array (e.g., a function)
      if (issue.expected?.includes('Array')) {
        return 'The "runtimeCaching" option must be an array of handlers.'
      }

      const index = issue.path?.find(p => p.type === 'array')?.key

      if (lastKey === 'handler') {
        if (issue.type === 'union') {
          if (issue.input === 'InvalidStrategy') {
            return `Invalid "handler" option in runtimeCaching[${index}]. ${issue.message}.`
          }
          return `Invalid "handler" option in runtimeCaching[${index}]. ${issue.message}.`
        }
        if (issue.type === 'object') {
          return `Invalid "handler" option in runtimeCaching[${index}]. The required option "handler" is missing.`
        }
      }

      // This is the catch-all for any other error inside a runtimeCaching item.
      // It handles cases where an item is not an object, or is missing urlPattern, etc.
      return `Invalid item at index ${index} in the "runtimeCaching" array. ${issue.message}.`
    }
  }

  // Priority 5: Generic type mismatch for other fields.
  if (issue.kind === 'schema') {
    return `Invalid type for option "${path}". Expected ${issue.expected} but received ${issue.received}.`
  }

  // Fallback for any other unhandled case.
  return issue.message
}

// This function intelligently sanitizes the options object from magicast.
function _sanitizeMagicastOptions(options: any): any {
  if (options === null || typeof options !== 'object')
    return options

  // Gracias a tu parche, podemos detectar los tipos directamente.
  if (options instanceof RegExp || typeof options === 'function') {
    return options
  }

  if (Array.isArray(options)) {
    // console.log('PASO')
    const sanitizedArray: any[] = []
    for (const option of options) {
      sanitizedArray.push(_sanitizeMagicastOptions(option))
    }
    return sanitizedArray
    // return options.map(sanitizeMagicastOptions)
  }

  /* if (options.$type === 'array') {
    const sanitizedArray: any[] = []
    for (const option of options) {
      sanitizedArray.push(sanitizeMagicastOptions(option))
    }
    return sanitizedArray
  } */

  const sanitized: { [key: string]: any } = {}
  for (const key in options) {
    if (Object.prototype.hasOwnProperty.call(options, key) && !key.startsWith('$'))
      sanitized[key] = _sanitizeMagicastOptions(options[key])
  }

  return sanitized
}

/**
 * A wrapper around Valibot's `safeParseAsync` that throws a user-friendly error
 * if validation fails.
 * @param schema The Valibot schema to use.
 * @param options The options object to validate.
 * @param methodName The name of the Workbox method being validated, for context.
 */
export async function validateAsync<TSchema extends BaseSchemaAsync<any, any, any>>(
  schema: TSchema,
  options: unknown,
  methodName: string,
): Promise<InferOutput<TSchema>> {
  const result = await safeParseAsync(
    schema,
    options,
  )
  if (!result.success) {
    const errorMessages = result.issues.map(extractIssueMessage)
    throw new Error(
      `${methodName}() options validation failed: \n- ${errorMessages.join('\n- ')}`,
    )
  }
  return result.output
}
