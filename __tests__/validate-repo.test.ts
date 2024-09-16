import fs from 'fs'
import path from 'path'
import { validateRepo } from '../src/validate-repo'

const fixture_dir = path.join(__dirname, 'fixtures')
const test_glob = (pattern: string): string =>
  path.join(fixture_dir, pattern, '*')

it('has no problems with valid configs', async () => {
  const errors = await validateRepo([test_glob('valid')])
  expect(errors).toHaveLength(0)
})

it('requires at least one book config', async () => {
  const errors = await validateRepo([test_glob('no-config')])
  expect(errors[0]).toMatchObject({
    description: expect.stringMatching(/No config files found./)
  })
})

it('requires all configs to be valid YAML', async () => {
  const invalidYamlPath = path.join(
    fixture_dir,
    'invalid-yaml',
    'invalid-yaml.book.yml'
  )

  // create an invalid yaml file in the fixture directory
  // this avoids a bug in GitHub Super-Linter that fails to ignore the invalid yaml file
  fs.mkdirSync(path.dirname(invalidYamlPath), { recursive: true })
  fs.writeFileSync(invalidYamlPath, 'name: "invalid yaml')

  try {
    const errors = await validateRepo([test_glob('invalid-yaml')])
    expect(errors[0]).toMatchObject({
      description: expect.stringMatching(/Missing closing "quote/)
    })
  } finally {
    // clean up the invalid yaml file
    fs.unlinkSync(invalidYamlPath)
  }
})

it('requires all configs to have `name` keys', async () => {
  const errors = await validateRepo([test_glob('missing-name')])
  expect(errors[0]).toMatchObject({
    description: expect.stringMatching(/Missing required property 'name'/)
  })
})

it('requires all configs to have unique `names`', async () => {
  const errors = await validateRepo([test_glob('repeated-name')])
  expect(errors[0]).toMatchObject({
    description: expect.stringMatching(
      /Some books have the same value for 'name'/
    )
  })
})

it('requires all configs to have `sortOrder` keys', async () => {
  const errors = await validateRepo([test_glob('missing-sortOrder')])
  expect(errors[0]).toMatchObject({
    description: expect.stringMatching(/Missing required property 'sortOrder'/)
  })
})

it('requires all configs to have unique `sortOrder`s', async () => {
  const errors = await validateRepo([test_glob('repeated-sortOrder')])
  expect(errors[0]).toMatchObject({
    description: expect.stringMatching(
      /Some books have the same value for 'sortOrder'/
    )
  })
})

it('requires that `sortOrder` be an integer', async () => {
  const errors = await validateRepo([test_glob('non-int-sortOrder')])
  expect(errors[0]).toMatchObject({
    description: expect.stringMatching(/must be integer/)
  })
})
