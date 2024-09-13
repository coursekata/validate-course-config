import { ErrorObject } from 'ajv'
import YAML from 'yaml'
import { bullet_list, cat } from './formatting'

export interface IConfigError {
  description: string
  location: string
  suggestion: string
}

abstract class BaseConfigError implements IConfigError {
  description = ''
  location = ''
  suggestion = ''
}

export class ParseError extends BaseConfigError {
  constructor(file: string, err: YAML.YAMLParseError) {
    super()
    this.description = err.message
    this.location = `${file}:${this.extract_location(err)}`
    this.suggestion = 'Fix YAML in offending config file.'
  }

  extract_location(error: YAML.YAMLParseError): string {
    if (error.linePos && error.linePos[0]) {
      return `${error.linePos[0].line}:${error.linePos[0].col}`
    }

    /* istanbul ignore next */
    return ''
  }
}

export class ValidationError extends BaseConfigError {
  constructor(
    file: string,
    error: ErrorObject<string, Record<string, any>, unknown>
  ) {
    super()
    switch (error.keyword) {
      case 'required':
        this.description = `Missing required property '${error.params.missingProperty}'`
        break
      case 'type':
        const property = error.instancePath.slice(1).replace(/\//g, '.')
        this.description = `The type of property '${property} ${error.message}`
        break
    }
    this.location = file
    this.suggestion = ''
  }
}

export class MissingConfigError extends BaseConfigError {
  constructor(search_paths: string[]) {
    super()
    const paths = search_paths.join(' ')
    this.description = `No config files found. Searched these paths: ${paths}`
    this.location = ''
    this.suggestion = cat([
      'Add at least one book configuration file to the repository.',
      'It must have the file extension `.book.yml`'
    ])
  }
}

export class RequiredUniqueError extends BaseConfigError {
  constructor(files: string[], key: string, value: string | number) {
    super()

    this.description = bullet_list(
      `Some books have the same value for '${key}' ('${value}'):`,
      files
    )
    this.location = ''
    this.suggestion = `Ensure all books have unique '${key}'s.`
  }
}
