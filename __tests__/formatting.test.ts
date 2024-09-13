import { expect, it } from '@jest/globals'
import { bullet_list, cat } from '../src/formatting'

it('should output the header above an indented, bulletted list', () => {
  expect(bullet_list('hello hello', ['a', 'b', 'c'])).toBe(
    'hello hello\n  - a\n  - b\n  - c'
  )
})

it('supports nesting bulleted lists', () => {
  const nested = bullet_list('top-level', [
    bullet_list('next-level', ['c', 'd'], 2),
    bullet_list('next-level', ['e', 'f'], 2)
  ])
  expect(nested).toBe(
    'top-level\n' +
      '  - next-level\n    - c\n    - d\n' +
      '  - next-level\n    - e\n    - f'
  )
})

it('concatenates strings into a single string', () => {
  const strings = ['a', 'b', 'c']
  expect(cat(strings)).toBe('a b c')
})
