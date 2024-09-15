import * as core from '@actions/core'
import { IConfigError } from './errors'
import { validate_repo } from './validate-repo'
import { relativize_paths } from './formatting'

interface ActionInputs {
  include: string[]
  follow_symbolic_links: boolean
  auto_update: boolean
  release_prefix: string
}

/**
 * Get the inputs for the action.
 * @returns The inputs for the action.
 */
function getInputs(): ActionInputs {
  const include = core.getMultilineInput('include')
  const follow_symbolic_links = core.getBooleanInput('follow-symbolic-links')
  const auto_update = core.getBooleanInput('auto-update')
  const release_prefix = core.getInput('release-prefix')

  core.debug(`include: ${include}`)
  core.debug(`follow_symbolic_links: ${follow_symbolic_links}`)
  core.debug(`auto_update: ${auto_update}`)
  core.debug(`release_prefix: ${release_prefix}`)

  return { include, follow_symbolic_links, auto_update, release_prefix }
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

    const validation_errors = await validate_repo(
      inputs.include,
      inputs.follow_symbolic_links,
      inputs.auto_update,
      inputs.release_prefix
    )
    core.setOutput('errors', validation_errors)
    if (validation_errors.length > 0) {
      const message = relativize_paths(format_error_message(validation_errors))
      core.setFailed(message)
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
 * Format the error message for the action.
 * @param validation_errors - The errors found during validation.
 * @returns The formatted error message.
 */
function format_error_message(validation_errors: IConfigError[]): string {
  return [
    'Some errors were found when validating the book configuration files',
    ...validation_errors.map(error => {
      const messages = [
        `Description: ${error.description}`,
        `Location: ${error.location}`
      ]
      if (error.suggestion !== '') {
        messages.push(`Suggestion: ${error.suggestion}`)
      }
      return messages.join('\n')
    })
  ].join('\n\n')
}
