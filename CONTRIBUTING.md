# Contributing to Stein
Thank you for showing interest into contributing to Stein! First off, some general information:
Kanri is written in TypeScript and is licensed under the MIT license. The landing page and docs site use Next.js and Fumadocs and [can be found here](https://stein.js.org). The documentation is still a big work in progress and if you would like to help, please reach out!


## Here’s the process for contributing to Kanri
* Fork the Stein repository, and clone it locally on your development machine.
* Find issues that are up for grabs in GitHub or look at the things that are todo or work in progress in the roadmap (projects tab). Comment to let everyone know you’re working on it and let a core contributor assign the issue to you. If there’s no issue for what you want to work on, you are free to continue with your changes but consider opening an issue or a discussion to make sure what you want to add is in line with the project vision.
* Make sure you have the Biome extension added to your code editor to ensure uniform code formatting.
* When your changes are checked in to your fork, make sure to test your code extensively. Your commits should also follow the commit conventions.
* Submit your pull request for a code review and wait for a Stein core contributor to review it. When in doubt, ask for help in the Stein Discord server or open an issue.

We’re glad you’re here; good luck and have fun. 🤍

## Development workspace
### Recommended IDE setup
* IDE: Visual Studio Code (w/ Biome extension)
* Node.js (LTS recommended) & NPM
* pnpm Package Manager (for workspace/monorepo support)

## Development

While building, you can use `pnpm dev` to watch the files and rebuild the project on changes.

You can then run [examples](./examples/) projects manually. Packages should be installed using `workspace:*` notation to make sure they're linked in the monorepo.

If you need to lint everything, you can run `pnpm lint`.

## Versioning

Run `pnpm changeset` to create a new changeset. This will prompt you to select the packages you want to bump and the type of bump you want to apply.
```