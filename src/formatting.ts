/**
 * Format a message and array of sub-points as a bullet-pointed string.
 * @param message The main message to show.
 * @param bullets An array of strings to convert to a bulleted list.
 * @param indent_level How far to indent the bullets (each level is two spaces).
 * @param bullet_char The character to use for the bullet point.
 */
export function bullet_list(
  message: string,
  bullets: string[],
  indent_level = 1,
  bullet_char = '-'
): string {
  const indent = '  '.repeat(indent_level)
  const bullet_strings = bullets.map(x => `${indent}${bullet_char} ${x}`)
  return `${message}\n${bullet_strings.join('\n')}`
}

/**
 * Convert an array of strings to a single string delimited by the `spacer`.
 * @param messages The strings to concatenate.
 * @param spacer The character to delimit the messages with.
 */
export function cat(messages: string[], spacer = ' '): string {
  return messages.join(spacer)
}

/**
 * Find and replace all instances of the current directory with "."
 * @param output An output string to format.
 */
export function relativize_paths(output: string): string {
  const matcher = new RegExp(process.cwd(), 'g')
  return output.replace(matcher, '.')
}
