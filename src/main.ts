import * as core from '@actions/core'
import { validateRepo } from './validate-repo'
import { IConfigError } from './errors'

interface ActionInputs {
  include: string[]
  follow_symbolic_links: boolean
}

/**
 * Get the inputs for the action.
 * @returns The inputs for the action.
 */
function getInputs(): ActionInputs {
  const include = core.getMultilineInput('include')
  const follow_symbolic_links = core.getBooleanInput('follow-symbolic-links')

  core.debug(`include: ${include}`)
  core.debug(`follow_symbolic_links: ${follow_symbolic_links}`)

  return { include, follow_symbolic_links }
}

/**
 * Validate the inputs for the action.
 * @param inputs - The inputs for the action.
 * @throws Error if the inputs are invalid.
 */
function validateInputs(inputs: ActionInputs): void {}

/**
 * The main function for the action.
 * @returns Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  safelyExecute(async () => {
    const inputs = getInputs()
    validateInputs(inputs)

    const errors = await validateRepo(
      inputs.include,
      inputs.follow_symbolic_links
    )

    core.setOutput('errors', errors)
    if (errors.length > 0) {
      core.setFailed(formatErrors(errors))
    }
  })
}

/**
 * Safely execute an action, catching any errors and setting the action as failed.
 * @param action - The action to execute.
 * @returns Resolves when the action is complete.
 */
async function safelyExecute(action: () => Promise<void>): Promise<void> {
  try {
    return await action()
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message)
    } else {
      core.setFailed(String(error))
    }
  }
}

/**
 * Format the errors for output.
 * @param errors - The errors to format.
 * @returns The formatted errors.
 */
function formatErrors(errors: IConfigError[]): string {
  return [
    'Some errors were found when validating the book configuration files',
    ...errors
  ].join('\n\n')
}
