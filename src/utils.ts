/**
 * Find and replace all instances of the current directory with "."
 * @param output An output string to format.
 */
export function relativizePaths(output: string): string {
  const matcher = new RegExp(process.cwd(), 'g')
  return output.replace(matcher, '.')
}
