# `kiosk-browser` integration tests

`kiosk-browser` uses a custom test server & runner to run integration tests within Electron with the `kiosk` global available just as it is normally. The custom test server is built on `vite` (see `vite.config.ts`) and the custom test runner is called `minitest` and is meant to resemble Jest's test runner (see `support/minitest.ts`). The tests are loaded and run from the `tests` directory by `index.html`.

## Running Tests

You can run the tests with `pnpm test:integration`, which calls the `run` script in this directory. In development, the test server will keep running and re-run the tests when the source code changes. In CI, the test server will be started and the tests will be run once.

## Adding a Test File

Add a file called `<something>.test.ts` to the `tests` directory. The file may contain `test` calls that make assertions using `expect` just like with Jest. The file may also contain `beforeEach` and `afterEach` calls that are run before and after each test.
