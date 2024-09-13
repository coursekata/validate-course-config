import * as core from '@actions/core'
import { IConfigError } from './errors'
import { validate_repo } from './validate-repo'
import { relativize_paths } from './formatting'

/**
 * The main function for the action.
 * @returns Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    const include = core.getMultilineInput('include')
    const follow_symbolic_links = core.getBooleanInput('follow-symbolic-links')
    const auto_update = core.getBooleanInput('auto-update')
    const release_prefix = core.getInput('release-prefix')
    core.debug(`include '${include}'`)
    core.debug(`auto-update '${auto_update}'`)
    core.debug(`release-prefix '${release_prefix}'`)

    if (
      !(
        Array.isArray(include) &&
        include.every(glob => typeof glob === 'string')
      )
    ) {
      const message =
        'Argument to `include` must be a string of globs (with newline characters separating globs).'
      core.setFailed(message)
      return
    }

    const validation_errors = await validate_repo(
      include,
      follow_symbolic_links,
      auto_update,
      release_prefix
    )
    core.setOutput('errors', validation_errors)
    if (validation_errors.length > 0) {
      const message = relativize_paths(format_error_message(validation_errors))
      core.setFailed(message)
    }
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
