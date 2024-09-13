# @coursekata/actions/validate-book-yaml

[![GitHub Super-Linter](https://github.com/actions/typescript-action/actions/workflows/linter.yml/badge.svg)](https://github.com/super-linter/super-linter)
![CI](https://github.com/actions/typescript-action/actions/workflows/ci.yml/badge.svg)
[![Check dist/](https://github.com/actions/typescript-action/actions/workflows/check-dist.yml/badge.svg)](https://github.com/actions/typescript-action/actions/workflows/check-dist.yml)
[![CodeQL](https://github.com/actions/typescript-action/actions/workflows/codeql-analysis.yml/badge.svg)](https://github.com/actions/typescript-action/actions/workflows/codeql-analysis.yml)
[![Coverage](./badges/coverage.svg)](./badges/coverage.svg)

This action searches a directory for CourseKata book configuration YAML files.
In each search path, any file matching `*.book.yaml` is considered. For each
book configuration file found, the YAML is validated and then the contents of
the YAML are validated against the book configuration specification. That
specification is detailed below in
[Valid Book Configuration](#valid-book-configuration)

## Inputs

```yaml
- uses: coursekata/actions/validate-book-yaml@v1
  with:
    # The globs to use to build search paths. Use a newline to separate each glob.
    # Optional. Default is '.'
    include: '.'

    # Indicates whether to follow symbolic links when searching with the globs.
    # Optional. Default is true
    follow-symbolic-links: true

    # Whether to attempt to update the release name and date in the book configs.
    # Optional. Default is false
    auto-update: false

    # The prefix used to indicate release branches when updating the release name and date.
    # Optional. Default is 'release/'
    release-prefix: 'release/'
```

## Outputs

<!-- prettier-ignore -->
| name | description | example |
| - | - | - |
| `errors` | A stringified JSON array of the errors. Each item is an error object with a `description` of the error, possibly the `location` (file) it occurred in, and possibly a `suggestion` for how to fix it. | `'{"description": "Missing required property 'name'", "location": "path/to/file", "suggestion": "Add a top-level 'name' property."}'` |

## Valid Book Configuration

### Main Top-Level Keys

```yaml
# Book name.
# Required. Supports book variable replacement.
name: 'Book Name'

# Book description.
# Required.
description: 'Book description'

# The position of the book in the list of books for the course version. The sort goes by sort order first and then by name.
# Required. Must be an integer.
sortOrder: 1

# Custom defined book string variables.
# Optional.
variables:
  var: 'ABC'

# List of book chapters.
# Required.
chapters:
  - # Chapter name.
    # Required. Supports chapter variable replacement.
    name: 'Chapter Name'

    # Custom defined chapter string variables.
    # Optional.
    variables:
      number: '1'

    # List of chapter pages.
    # Required.
    pages:
      - # Page name.
        # Required. Supports chapter/page variable replacement.
        name: 'Page Name'

        # Short name that would appear on reports.
        # Required. Supports chapter/page variable replacement.
        shortName: 'Short Name'

        # The markdown file location.
        # Required.
        file: 'path/to/file.md'

        # Indicates if the page is required to continue. If true, the student won’t be able to continue until the page is completed. If omitted, it is assumed that it is not required. This validation is only checked for real classes.
        required: true

# Customization of the My CourseKata dashboard.
# Optional. If not included, default values are assumed.
dashboard:
  # The name that will appear as the link on the LMS page.
  # Required if the above `dashboard` key is included. Default is "My Progress + Jupyter".
  name: 'My Progress + Jupyter'

  # List of tabs that should be shown in the dashboard.
  # Required if the above `dashboard` key is included. At least one value should be included.
  tabs:
    # Indicates if the Class tab should be present. This also controls the My Progress tab for students.
    - class

    # Indicates if the Students tab should be present.
    - students

    # Indicates if the Jupyter tab should be present.
    - jupyter

# List of tools to be included on the book.
# Optional. Default is none.
tools:
  # Include Hypothes.is as a sidebar tool.
  - hypothesis
```

### Sample file

```yaml
name: 'Sample Book - {{ book.var }}'
description: Sample book's description
sortOrder: 1
variables:
  var: 'ABC'
chapters:
  - name: 'Chapter {{ chapter.number }}. Introduction!'
    variables:
      number: '1'
    pages:
      - name: '{{ page.number }} Welcome to Statistics'
        shortName: 'Page {{ page.number }}'
        file: 'chapter-01/1.0-welcome.md'
        variables:
          number: '1.0'
      - name: '{{ page.number }} What Is Understanding?'
        shortName: 'Page {{ page.number }}'
        variables:
          number: '1.1'
        file: 'chapter-01/1.1-understanding.md'
        required: true

  - name: 'Chapter 2. Understanding Data'
    lessons:
      - name: 'Understanding Data'
        shortName: Page 2.0
        file: 'chapter-02/2.0-bunch-of-numbers.md'

dashboard:
  name: 'My Progress + Jupyter'
  tabs:
    - class
    - students
    - jupyter

tools:
  - hypothesis
```

### Content validations

As part of the course build, there are a series of content validations that are
run before persisting the changes. The current validations that are checked with
this Action are described below, however, they are all checked again during the
build process along with other more fine-grained errors. The checks here are
just to prevent problems from being committed to the repositories.

- At least one `*.book.yml` file must be present.
- Book file must be a valid YAML.
- Book `name` must be present.
- Book `name` must not be repeated in the same course version.
- Book `sortOrder` must be present and be a valid integer.

## Automatically update version and date

If `auto-update` is specified, the release version and date will be updated in
each of the book configs. The release version is taken from the branch name, and
it will fail to update if the branch name does not follow one of these two
formats: `release/v<some version>` `release/<some-version>`. The release date
will be updated to match the current date of the run.

## Usage

### Basic

This example will search the root directory of a repository for book
configuration files to validate:

```yaml
steps:
  # https://github.com/actions/checkout
  - uses: actions/checkout@v4

  # https://github.com/UCLATALL/actions/validate-book-yaml
  - name: 'Validate the book configuration files'
    uses: UCLATALL/actions/validate-book-yaml@v1
```

### Using the output

In this example, the errors and warnings are piped into another script using
[`actions/github-script`](https://github.com/actions/github-script):

```yaml
steps:
  # https://github.com/actions/checkout
  - uses: actions/checkout@v4

  # https://github.com/coursekata/validate-book-yaml
  - name: 'Validate the book configuration files'
    uses: coursekata/validate-book-yaml@v1
    continue-on-error: true

  # https://github.com/actions/github-script
  - name: 'Use the errors in another step'
    uses: actions/github-script@v7
    env:
      ERRORS: ${{ steps.validate-book-yaml.outputs.errors }}
    with:
      script: |
        // assert that there are no errors
        const assert_equal = (value) => require("node:assert/strict").deepEqual(value, true)
        assert_equal(Object.keys(JSON.parse(process.env['ERRORS'])).length !== 0)
```
