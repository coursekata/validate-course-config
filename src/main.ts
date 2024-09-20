import * as core from '@actions/core'
import { validateRepo } from './validate-repo'
import {
  DuplicateAcrossFilesError,
  DuplicateWithinFileError,
  IConfigError,
  MissingConfigError,
  ParseError,
  ValidationError
} from './errors'
import { relativizePaths } from './utils'

interface ActionInputs {
  include: string[]
  followSymbolicLinks: boolean
}

/**
 * Get the inputs for the action.
 * @returns The inputs for the action.
 */
function getInputs(): ActionInputs {
  let include: string[]
  let followSymbolicLinks: boolean

  if (process.env.GITHUB_ACTIONS) {
    include = core.getMultilineInput('include')
    followSymbolicLinks = core.getBooleanInput('follow-symbolic-links')
  } else {
    include = ['.']
    followSymbolicLinks = false
  }

  core.debug(`include: ${include}`)
  core.debug(`followSymbolicLinks: ${followSymbolicLinks}`)

  return { include, followSymbolicLinks }
}

/**
 * The main function for the action.
 * @returns Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  safelyExecute(async () => {
    const inputs = getInputs()

    const errors = await validateRepo(
      inputs.include,
      inputs.followSymbolicLinks
    )

    core.setOutput('errors', relativizePaths(JSON.stringify(errors)))
    if (errors.length > 0) {
      await summarize(errors)
      core.setFailed('Course config validation failed, see summary for details')
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

async function summarize(errors: IConfigError[]): Promise<void> {
  const missingConfig = errors.filter(e => e instanceof MissingConfigError)
  if (missingConfig.length > 0) {
    await core.summary
      .addHeading('Course Config Validation')
      .addRaw('No configuration files found')
      .addCodeBlock(JSON.stringify(missingConfig, null, 2))
      .write()

    return
  }

  const summaries = [
    ParseError,
    ValidationError,
    DuplicateWithinFileError,
    DuplicateAcrossFilesError
  ].map(errorType => ErrorSummary.fromErrors(errors, errorType))

  const grandSummary = core.summary
    .addHeading('Course Config Validation Failed')
    .addTable([
      [
        { data: 'Test', header: true },
        { data: 'Status', header: true }
      ],
      ...summaries.map(s => s.row())
    ])

  summaries
    .filter(s => !s.passing())
    .forEach(s => grandSummary.addHeading(s.name, 2).addList(s.listItems()))

  await grandSummary.write()
}

class ErrorSummary {
  constructor(
    readonly name: string,
    private readonly errors: IConfigError[]
  ) {}

  passing(): boolean {
    return this.errors.length === 0
  }

  status(): string {
    return this.passing() ? 'Pass ✅' : 'Fail ❌'
  }

  row(): [string, string] {
    return [this.name, this.status()]
  }

  listItems(): string[] {
    return this.errors.map(e => {
      const location = e.location ? `${e.location}: ` : ''
      return relativizePaths(`${location}**${e.description}.** ${e.suggestion}`)
    })
  }

  static fromErrors(
    errors: IConfigError[],
    errorType: new (...args: any[]) => IConfigError // eslint-disable-line @typescript-eslint/no-explicit-any
  ): ErrorSummary {
    return new ErrorSummary(
      errorType.name,
      errors.filter(e => e instanceof errorType)
    )
  }
}
