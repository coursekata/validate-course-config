import { expect, it } from '@jest/globals'
import { DateTime } from 'luxon'
import { determine_release } from '../src/determine-release'

it('fails when the release is not for a release branch push', () => {
  expect(() => determine_release('refs/tags/feature-branch-1')).toThrow()
  expect(() => determine_release('refs/pull/2/merge')).toThrow()
  expect(() => determine_release('refs/heads/feature/v1.0')).toThrow()
})

it('returns the current date', () => {
  const timezone = 'America/Los_Angeles'
  const current_date = DateTime.now()
    .setZone(timezone)
    .toLocaleString(DateTime.DATE_FULL)
  const release = determine_release('refs/heads/release/v1.0', timezone)
  expect(release.date).toEqual(current_date)
})

it('extracts the version number when named like `release/v1.0`', () => {
  const timezone = 'America/Los_Angeles'
  const release_number = determine_release('refs/heads/release/v1.0', timezone)
  expect(release_number.name).toBe('1.0')
})

it('extracts the version name when named like `release/anything-else`', () => {
  const timezone = 'America/Los_Angeles'
  const release_name = determine_release(
    'refs/heads/release/anything',
    timezone
  )
  expect(release_name.name).toBe('anything')
})

it('accepts different release prefixes', () => {
  const timezone = 'America/Los_Angeles'
  const release_name = determine_release(
    'refs/heads/test/anything',
    timezone,
    'test/'
  )
  expect(release_name.name).toBe('anything')
})
