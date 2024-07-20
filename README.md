# Stein

Yet another JavaScript framework but it's called rock in German.

Stein is a framework for [SolidJS](https://solidjs.com) built on top of Vite to provide helpers and tools to make your life easier while developing SPAs.

## Development

While building, you can use `pnpm dev` to watch the files and rebuild the project on changes.

You can then run [examples](./examples/) projects manually. Packages should be installed using `workspace:*` notation to make sure they're linked in the monorepo.

If you need to lint everything, you can run `pnpm lint`.

## Versioning

Run `pnpm changeset` to create a new changeset. This will prompt you to select the packages you want to bump and the type of bump you want to apply.
