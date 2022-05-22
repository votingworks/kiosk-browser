/**
 * This is a config file for vite, a development and production server,
 * being used instead to test `kiosk-browser` within Electron.
 *
 * It uses a custom test server to include all the integration tests from
 * `test/integration/tests` and run them using `minitest`, a custom test runner
 * meant to resemble Jest's test runner. It provides `test`, `expect`, and
 * `beforeEach`/`afterEach` hooks to be used in the tests just like in Jest.
 *
 * See `index.html` for the test runner.
 */

import chalk from 'chalk';
import { JestAssertionError } from 'expect';
import { join } from 'path';
import { defineConfig, Plugin } from 'vite';
import { TestResult } from './support/minitest';
import bodyParser = require('body-parser');

function testServer(): Plugin {
  let lastTestModule: string | undefined;
  const results: TestResult[] = [];

  return {
    name: 'test-server',
    configureServer(app): void {
      app.middlewares
        .use(bodyParser.json())

        // print test results as they come in
        .use('/minitest/results', (req, res) => {
          if (req.method !== 'POST') {
            res.statusCode = 405;
            res.end();
            return;
          }

          const result = (req as unknown as { body: TestResult }).body;
          results.push(result);

          // print the name of the test module above its results
          if (result.testModulePath !== lastTestModule) {
            lastTestModule = result.testModulePath;
            console.log();
            console.log(chalk.bold(result.testModulePath.replace(/^\.\//, '')));
          }

          if (result.success) {
            console.log(`✅ ${result.test}`);
          } else {
            console.error(`❌ ${result.test}`);
            console.error(
              `  ${chalk.red(
                ('matcherResult' in result.error &&
                  (result.error as JestAssertionError).matcherResult
                    ?.message) ??
                  result.error.message,
              )}`,
            );
          }
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ ok: true }));
        })

        // print a summary of the results
        .use('/minitest/done', (req, res) => {
          res.end();

          const successes = results.filter((result) => result.success);
          const failures = results.filter((result) => !result.success);
          console.log();

          if (failures.length) {
            console.log(
              `${successes.length} passed, ${chalk.redBright(
                `${failures.length} failed`,
              )}`,
            );
          } else {
            console.log(chalk.greenBright(`${successes.length} passed`));
          }

          console.log();

          // exit after running in CI
          if (process.env.CI) {
            process.exit(successes.length === results.length ? 0 : 1);
          }

          // reset test results
          results.splice(0);
        });
    },
  };
}

export default defineConfig({
  resolve: {
    alias: {
      // stub `jest-snapshot` since it relies on a bunch of NodeJS stuff
      'jest-snapshot': join(__dirname, 'support/stubs/jest-snapshot.ts'),
    },
  },

  plugins: [testServer()],
});
