# Contribution Guideline

This document describes how to set up your development environment to build projects.

- [Contribution Guideline](#contribution-guideline)
  - [Formatting your source code](#formatting-your-source-code)
  - [Commit Messages](#commit-messages)
    - [Examples](#examples)
  - [Versioning and Changelogs](#versioning-and-changelogs)

## Formatting your source code

This project uses [eslint](https://eslint.org/) and [prettier](https://prettier.io/) to lint the source code.
If the source code is not properly formatted, the CI will fail and the PR cannot be merged.

You can automatically check and format your code by running:

- `yarn lint` # shows the linting errors
- `yarn lint --fix` # formats the source code

## Commit Messages

We use [standard-version](https://github.com/conventional-changelog/standard-version#commit-message-convention-at-a-glance) with [Conventional Commits](https://www.conventionalcommits.org) for generating change logs. Please review the message
formatting rules under these 2 projects and ensure your commit message complies with them.

The commit message should be structured as follows:

```markdown
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

The commit contains the following structural elements, to communicate intent to the consumers of your library:

- **fix**: a commit of the type fix patches a bug in your codebase (this correlates with **PATCH** in semantic versioning).
- **feat**: a commit of the type feat introduces a new feature to the codebase (this correlates with **MINOR** in semantic versioning).
- **BREAKING CHANGE**: a commit that has a footer BREAKING CHANGE:, or appends a ! after the type/scope, introduces a breaking API change (correlating with **MAJOR** in semantic versioning). A BREAKING CHANGE can be part of commits of any type.
- types other than fix: and feat: are allowed, for example build:, chore:, ci:, docs:, style:, refactor:, perf:, test: are recommended for other types of commits

### Examples

- ```markdown
  feat: allow provided config object to extend other configs

  BREAKING CHANGE: `extends` key in config file is now used for extending other config files
  ```

- ```markdown
  feat(lang): add turkish language
  ```

- ```markdown
  docs: correct spelling of CHANGELOG
  ```

## Versioning and Changelogs

Changelog should be auto generated based on commits. To facilitate this, we use `release-please` software.

Review [release-please](https://github.com/googleapis/release-please) and [Conventional Commits](https://www.conventionalcommits.org) for commit guidelines.

If commits are properly named, relase-please will take care of version incrementing within `package.json` file and will create the tags on git
