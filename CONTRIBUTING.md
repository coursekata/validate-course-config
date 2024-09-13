# Contributing Guide

This action was created using the
[TypeScript action template](https://github.com/actions/typescript-action). It
includes compilation support, tests, a validation workflow, publishing, and
versioning guidance.

## Initial Setup

After you've cloned the repository to your local machine or codespace, you'll
need to perform some initial setup steps before you can develop the action.

> [!NOTE]
>
> You'll need to have a reasonably modern version of
> [Node.js](https://nodejs.org) handy (20.x or later should work!). If you are
> using a version manager like [`nodenv`](https://github.com/nodenv/nodenv) or
> [`nvm`](https://github.com/nvm-sh/nvm), this template has a `.node-version`
> file at the root of the repository that will be used to automatically switch
> to the correct version when you `cd` into the repository. Additionally, this
> `.node-version` file is used by GitHub Actions in any `actions/setup-node`
> actions.

1. :hammer_and_wrench: Install the dependencies

   ```bash
   npm install
   ```

1. :building_construction: Package the TypeScript for distribution

   ```bash
   npm run bundle
   ```

1. :white_check_mark: Run the tests

   ```bash
   npm test
   ```

## Action Metadata

The [`action.yml`](action.yml) file defines metadata about the action, such as
input(s) and output(s). For details about this file, see
[Metadata syntax for GitHub Actions](https://docs.github.com/en/actions/creating-actions/metadata-syntax-for-github-actions).

If you alter this file, you will likely also need to alter the inputs/outputs in
the [`src/main.ts`](src/main.ts) file to match the new action configuration.

## Update the Action Code

The [`src/`](./src/) directory is the heart of the action! This contains the
source code that will be run when the action is invoked.

There are a few things to keep in mind when developing action code:

- Most GitHub Actions toolkit and CI/CD operations are processed asynchronously.
  In `main.ts`, you will see that the action is run in an `async` function.

  ```typescript
  import * as core from '@actions/core'
  //...

  async function run(): Promise<void> {
    try {
      //...
    } catch (error) {
      core.setFailed(error.message)
    }
  }
  ```

  For more information about the GitHub Actions toolkit, see the
  [documentation](https://github.com/actions/toolkit/blob/master/README.md).

- The npm scripts and tooling is setup so that you shouldn't need to ever run
  `tsc` directly. Instead, use the relevant npm scripts to build, test, and lint
  your code.

### Developing

1. Create a new branch

   ```bash
   git checkout -b releases/v1
   ```

2. Edit the contents of `src/`
3. Add tests to `__tests__/` to test the new functionality or bug fix
4. Format, test, and build the action

   ```bash
   npm run all
   ```

   > [!IMPORTANT]
   >
   > This step will run [`ncc`](https://github.com/vercel/ncc) to build the
   > final JavaScript action code with all dependencies included. If you do not
   > run this step, your action will not work correctly when it is used in a
   > workflow. This step also includes the `--license` option for `ncc`, which
   > will create a license file for all of the production node modules used in
   > your project.

5. Commit your changes using conventional commit messages

   ```bash
   git add .
   git commit -m "feat: Add new functionality"
   ```

6. Push them to your repository

   ```bash
   git push -u origin releases/v1
   ```

7. Create a pull request and get feedback on your action
8. Merge the pull request into the `main` branch

Both when the pull request is merged and when you push to the `main` branch, the
action will be built and tested automatically. If the tests fail, the errors
will be reported in the pull request or commit.

## Publishing a New Release

After publishing, you can create version tag(s) that developers can use to
reference different stable versions of your action. For more information, see
[Versioning](https://github.com/actions/toolkit/blob/master/docs/action-versioning.md)
in the GitHub Actions toolkit.

This project includes a helper script, [`script/release`](./script/release)
designed to streamline the process of tagging and pushing new releases for
GitHub Actions.

GitHub Actions allows users to select a specific version of the action to use,
based on release tags. This script simplifies this process by performing the
following steps:

1. **Retrieving the latest release tag:** The script starts by fetching the most
   recent SemVer release tag of the current branch, by looking at the local data
   available in your repository.
1. **Prompting for a new release tag:** The user is then prompted to enter a new
   release tag. To assist with this, the script displays the tag retrieved in
   the previous step, and validates the format of the inputted tag (vX.X.X). The
   user is also reminded to update the version field in package.json.
1. **Tagging the new release:** The script then tags a new release and syncs the
   separate major tag (e.g. v1, v2) with the new release tag (e.g. v1.0.0,
   v2.1.2). When the user is creating a new major release, the script
   auto-detects this and creates a `releases/v#` branch for the previous major
   version.
1. **Pushing changes to remote:** Finally, the script pushes the necessary
   commits, tags and branches to the remote repository. From here, you will need
   to create a new release in GitHub so users can easily reference the new tags
   in their workflows.
