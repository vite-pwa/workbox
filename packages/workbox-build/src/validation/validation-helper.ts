import type { BaseIssue, BaseSchema } from 'valibot'
import { safeParse, setGlobalMessage } from 'valibot'

// Set a global configuration for Valibot's error messages to make them
// more user-friendly for Workbox consumers.
setGlobalMessage((issue: BaseIssue<any>) => {
  // The path provides context to which field has the error.
  // We get the last key in the path for the most specific field name.
  const key = issue.path?.[issue.path.length - 1]?.key

  // When a required key is missing, Valibot's `issue.received` is 'undefined'.
  // This is a robust way to create a user-friendly "missing option" message.
  if (issue.received === 'undefined') {
    return `The required option "${key}" is missing.`
  }

  // For unknown keys in strict objects, `issue.expected` is 'never'.
  // This allows us to create a clear "unknown option" message.
  if (issue.expected === 'never') {
    return `The option "${key}" is unknown or has been deprecated.`
  }

  // For all other errors, including our custom pipes (e.g., `endsWith`),
  // the message provided directly to the validation function is used.
  // We fall back to this to ensure custom messages are always respected.
  return issue.message
})

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
    const errorMessages = result.issues.map(issue => issue.message)
    throw new Error(
      `${methodName}() options validation failed: \n- ${errorMessages.join('\n- ')}`,
    )
  }
}
