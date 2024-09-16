import { ErrorObject } from 'ajv'
import YAML from 'yaml'

export interface IConfigError {
  description: string
  location: string
  suggestion: string
}

abstract class BaseConfigError implements IConfigError {
  description = ''
  location = ''
  suggestion = ''

  /**
   * Convert the error to a string.
   * @returns The error as a string.
   */
  toString(): string {
    const lines = [
      `Description: ${this.description}`,
      `Location: ${this.location}`
    ]
    if (this.suggestion) {
      lines.push(`Suggestion: ${this.suggestion}`)
    }
    return this.relativizePaths(lines.join('\n'))
  }

  /**
   * Find and replace all instances of the current directory with "."
   * @param output An output string to format.
   */
  relativizePaths(output: string): string {
    const matcher = new RegExp(process.cwd(), 'g')
    return output.replace(matcher, '.')
  }
}

export class ValidationError extends BaseConfigError {
  constructor(file: string, error: ValidationErrorObject) {
    super()

    if (isRequiredParams(error.params)) {
      this.description = `Missing required property '${error.params.missingProperty}'`
    } else if (isTypeParams(error.params)) {
      this.description = `The type of property '${error.params.instancePath.slice(1).replace(/\//g, '.')}' ${error.message}`
    } else {
      this.description = error.message ?? 'Unknown validation error'
    }

    this.location = file
    this.suggestion =
      'Ensure all properties are correctly set based on the schema.'
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

export class ParseError extends BaseConfigError {
  constructor(file: string, err: YAML.YAMLParseError) {
    super()
    this.description = err.message
    this.location = `${file}:${this.extractLocation(err)}`
    this.suggestion = 'Fix YAML in the offending config file.'
  }

  private extractLocation(error: YAML.YAMLParseError): string {
    if (error.linePos && error.linePos[0]) {
      return `${error.linePos[0].line}:${error.linePos[0].col}`
    }
    return ''
  }
}

export class MissingConfigError extends BaseConfigError {
  constructor(searchPaths: string[]) {
    super()
    this.description = `No config files found. Searched paths: ${searchPaths.join(', ')}`
    this.location = ''
    this.suggestion =
      'Add at least one valid book configuration file with the `.book.yml` extension.'
  }
}

export class RequiredUniqueError extends BaseConfigError {
  constructor(files: string[], key: string, value: string | number) {
    super()
    this.description = `Some books have the same value for '${key}' ('${value}'): ${files.join(', ')}`
    this.location = ''
    this.suggestion = `Ensure all books have unique values for '${key}'.`
  }
}
