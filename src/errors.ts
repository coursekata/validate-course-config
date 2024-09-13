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

    return ''
  }
}

export class ValidationError extends BaseConfigError {
  constructor(file: string, error: ValidationErrorObject) {
    super()
    if (isRequiredParams(error.params)) {
      this.description = `Missing required property '${error.params.missingProperty}'`
    } else if (isTypeParams(error.params)) {
      this.description = `The type of property '${error.params.instancePath.slice(1).replace(/\//g, '.')} ${error.message}`
    } else {
      this.description = error.message ?? 'Unknown validation error'
    }

    this.location = file
    this.suggestion = ''
  }
}

export type ValidationErrorObject = ErrorObject<string, ErrorParams, unknown>
type ErrorParams = RequiredParams | TypeParams
interface RequiredParams {
  missingProperty: string
}
interface TypeParams {
  instancePath: string
  message: string
}

function isRequiredParams(params: ErrorParams): params is RequiredParams {
  return (params as RequiredParams).missingProperty !== undefined
}

function isTypeParams(params: ErrorParams): params is TypeParams {
  return (
    (params as TypeParams).instancePath !== undefined &&
    (params as TypeParams).message !== undefined
  )
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
