import * as core from '@actions/core'
import * as glob from '@actions/glob'
import Ajv from 'ajv'
import fs from 'fs'
import path from 'path'
import YAML from 'yaml'
import { determine_release } from './determine-release'
import {
  IConfigError,
  ParseError,
  RequiredUniqueError,
  MissingConfigError,
  ValidationError,
  ValidationErrorObject
} from './errors'
import { book_schema, BookConfig } from './schema'

export async function validate_repo(
  include: string[],
  follow_symbolic_links = true,
  auto_update = false,
  release_prefix = 'release/'
): Promise<IConfigError[]> {
  const ajv = new Ajv({ allowUnionTypes: true })
  const validate = ajv.compile(book_schema)

  const globber = await glob.create(include.join('\n'), {
    followSymbolicLinks: follow_symbolic_links,
    matchDirectories: false
  })

  let file_count = 0
  const errors: IConfigError[] = []
  const configs: BookConfig[] = []
  const unique_trackers: Record<string, Record<string, string[]>> = {
    name: {},
    sortOrder: {}
  }

  for await (const file of globber.globGenerator()) {
    if (!path.basename(file).endsWith('.book.yml')) {
      continue
    }

    core.debug(`validating '${file}'`)
    file_count++
    const yaml = fs.readFileSync(file, 'utf-8')
    let config: BookConfig
    let was_error = false

    try {
      config = YAML.parse(yaml)
      configs.push(config)
    } catch (err) {
      errors.push(new ParseError(file, err as YAML.YAMLParseError))
      was_error = true
      continue
    }

    validate(config)
    validate.errors?.forEach(error => {
      errors.push(new ValidationError(file, error as ValidationErrorObject))
      was_error = true
    })

    // track values that should be unique across configs
    if (!validate.errors) {
      for (const tracker_name in unique_trackers) {
        const tracker = unique_trackers[tracker_name]
        const value = config[tracker_name as 'name' | 'sortOrder'].toString()
        if (!tracker[value]) tracker[value] = []
        tracker[value].push(file)
      }
    }

    // auto-update release and date
    const github_ref = process.env['GITHUB_REF']
    if (auto_update) {
      if (was_error) {
        core.warning('skipping auto-update: there were validation errors')
      } else if (!github_ref) {
        core.warning(
          'skipping auto-update: could not retrieve commit reference'
        )
      } else {
        core.debug(`auto-updating release information`)

        const release = determine_release(
          github_ref,
          'America/Los_Angeles',
          release_prefix
        )
        core.debug(`release name: '${release.name}'`)
        core.debug(`release date: '${release.date}'`)

        if (!config.variables) config.variables = {}
        config.variables.release = release.name
        config.variables.release_date = release.date

        core.debug(`writing updated config to '${file}'`)
        fs.writeFileSync(
          file,
          YAML.stringify(config, {
            lineWidth: 120
          })
        )
      }
    }
  }

  for (const tracker_name in unique_trackers) {
    core.debug(`checking unique key across configs: '${tracker_name}'`)
    const tracker = unique_trackers[tracker_name]
    for (const value in tracker) {
      const files = tracker[value]
      if (files.length > 1) {
        errors.push(new RequiredUniqueError(files, tracker_name, value))
      }
    }
  }

  // no configs
  if (file_count === 0) {
    errors.push(new MissingConfigError(globber.getSearchPaths()))
  }

  return errors
}
