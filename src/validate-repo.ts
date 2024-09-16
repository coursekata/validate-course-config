import * as core from '@actions/core'
import * as glob from '@actions/glob'
import Ajv from 'ajv'
import fs from 'fs'
import path from 'path'
import YAML from 'yaml'
import {
  IConfigError,
  ParseError,
  RequiredUniqueError,
  MissingConfigError,
  ValidationError,
  ValidationErrorObject
} from './errors'
import { bookSchema } from './schema'
import { BookConfig } from './models'

const ajv = new Ajv({ allowUnionTypes: true })
const validateConfig = ajv.compile(bookSchema)

/**
 * Validate the repository configuration.
 * @param include The glob patterns to search for.
 * @param followSymbolicLinks Whether to follow symbolic links.
 * @returns A list of errors found in the configuration.
 */
export async function validateRepo(
  include: string[],
  followSymbolicLinks = true
): Promise<IConfigError[]> {
  const errors: IConfigError[] = []
  const configs: Record<string, BookConfig> = {}
  const glob = await globConfigs(include, followSymbolicLinks)
  const { files, searchPaths } = glob

  if (files.length === 0) {
    return [new MissingConfigError(searchPaths)]
  }

  for (const file of files) {
    const config = parseYAMLFile(file, errors)
    if (!config) continue

    validateConfigSchema(file, config, errors)
    configs[file] = config
  }

  checkUniqueValues(configs, ['sortOrder', 'name'], errors)
  return errors
}

/**
 * Glob the configuration files.
 * @param include The glob patterns to search for.
 * @param followSymbolicLinks Whether to follow symbolic links.
 * @returns The list of files found and the search paths.
 */
async function globConfigs(
  include: string[],
  followSymbolicLinks: boolean
): Promise<{ files: string[]; searchPaths: string[] }> {
  core.debug(`Globbing for patterns: ${include.join(', ')}`)

  const globber = await glob.create(include.join('\n'), {
    followSymbolicLinks: followSymbolicLinks,
    matchDirectories: false
  })

  const globbedFiles = await globber.glob()
  core.debug(`Globbed files: ${globbedFiles.join(', ')}`)

  const files = globbedFiles.filter(file => {
    return path.basename(file).endsWith('.book.yml')
  })

  core.debug(`Filtered files: ${files.join(', ')}`)
  return { files, searchPaths: globber.getSearchPaths() }
}

/**
 * Parse a YAML file into a BookConfig object.
 * @param file The file to parse.
 * @param errors The list of errors to append to if parsing fails.
 * @returns The parsed BookConfig or undefined if there was a parse error.
 */
function parseYAMLFile(
  file: string,
  errors: IConfigError[]
): BookConfig | undefined {
  core.debug(`Parsing YAML file: '${file}'`)
  const yaml = fs.readFileSync(file, 'utf-8')
  try {
    return YAML.parse(yaml) as BookConfig
  } catch (err) {
    errors.push(new ParseError(file, err as YAML.YAMLParseError))
    return undefined
  }
}

/**
 * Validate a BookConfig object against the schema.
 * @param file The file path of the configuration.
 * @param config The BookConfig object to validate.
 * @param errors The list of errors to append to if validation fails.
 */
function validateConfigSchema(
  file: string,
  config: BookConfig,
  errors: IConfigError[]
): void {
  core.debug(`Validating schema for '${file}'`)
  validateConfig(config)
  validateConfig.errors?.forEach(error => {
    errors.push(new ValidationError(file, error as ValidationErrorObject))
  })
}

/**
 * Ensure that specific fields (like `name` and `sortOrder`) are unique across all configs.
 * @param configs A map of file paths to BookConfig objects.
 * @param keys The list of keys to check for uniqueness.
 * @param errors The list of errors to append to if uniqueness validation fails.
 */
function checkUniqueValues(
  configs: Record<string, BookConfig>,
  keys: string[],
  errors: IConfigError[]
): void {
  // initialize tracker for each key
  const trackers: Record<string, Record<string, string[]>> = {}
  keys.forEach(key => (trackers[key] = {}))

  // track the values for each key in each config
  for (const filepath in configs) {
    const config = configs[filepath]
    keys.forEach(key =>
      trackValue(trackers[key], config[key]?.toString(), filepath)
    )
  }

  // check for uniqueness in each key
  keys.forEach(key => {
    checkUnique(trackers[key], key, errors)
  })
}

/**
 * Track the unique values of a specific field across configs.
 * @param tracker The unique value tracker object.
 * @param value The value to track.
 * @param key The key to track (e.g., 'name', 'sortOrder').
 * @param file The file where the value is found.
 * @param errors The list of errors to append to if uniqueness fails.
 */
function trackValue(
  tracker: Record<string, string[]>,
  value: string | undefined,
  file: string
): void {
  if (!value) return

  if (!tracker[value]) {
    tracker[value] = []
  }

  tracker[value].push(file)
}

/**
 * Check for uniqueness in tracked values and report errors if duplicates are found.
 * @param tracker The tracker object storing files for each value.
 * @param key The key being tracked.
 * @param errors The list of errors to append to if duplicates are found.
 */
function checkUnique(
  tracker: Record<string, string[]>,
  key: string,
  errors: IConfigError[]
): void {
  for (const value in tracker) {
    const files = tracker[value]
    if (files.length > 1) {
      errors.push(new RequiredUniqueError(files, key, value))
    }
  }
}
