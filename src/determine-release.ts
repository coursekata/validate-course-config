import { DateTime } from 'luxon'

interface Release {
  name: string
  date: string
}

/**
 * Determine the release information for a branch.
 * @param github_ref The fully-formed ref of the branch or tag that triggered the workflow run.
 *  For workflows triggered by push, this is the branch or tag ref that was pushed. For workflows
 *  triggered by pull_request, this is the pull request merge branch. For workflows triggered by
 *  release, this is the release tag created. For other triggers, this is the branch or tag ref
 *  that triggered the workflow run. This is only set if a branch or tag is available for the event
 *  type. The ref given is fully-formed, meaning that for branches the format is
 *  `refs/heads/<branch_name>`, for pull requests it is refs/pull/<pr_number>/merge, and for tags
 *  it is `refs/tags/<tag_name>`. For example, `refs/heads/feature-branch-1`.
 * @param timezone The Olson name for the timezone to use when setting release date.
 * @param release_prefix The prefix for release branches. Throws if prefix does not match.
 */
export function determine_release(
  github_ref: string,
  timezone: string = 'America/Los_Angeles',
  release_prefix: string = 'release/'
): Release {
  const full_prefix = `refs/heads/${release_prefix}`
  if (!github_ref.startsWith(full_prefix)) {
    throw Error(
      `'${github_ref}' does not have the required prefix '${release_prefix}'`
    )
  }

  const unprefixed_ref = github_ref.substring(full_prefix.length)
  const pattern = /^v(\d+[.]\d+(?:[.]\d+)?)$|(.*)/
  const matches = unprefixed_ref.match(pattern)
  if (!matches) {
    throw Error(`Could not determine release name from '${github_ref}'`)
  }

  return {
    name: matches[1] ?? matches[2],
    date: DateTime.now().setZone(timezone).toLocaleString(DateTime.DATE_FULL)
  }
}
