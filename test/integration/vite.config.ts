import chalk from 'chalk';
import { defineConfig, Plugin } from 'vite';
import bodyParser = require('body-parser');
import { TestResult } from './minitest';

function testServer(): Plugin {
  const results: TestResult[] = [];

  return {
    name: 'test-server',
    configureServer(app): void {
      app.middlewares
        .use(bodyParser.json())

        // collect all results
        .use('/minitest/results', (req, res) => {
          if (req.method !== 'POST') {
            res.statusCode = 405;
            res.end();
            return;
          }

          const result = (req as unknown as { body: TestResult }).body;
          results.push(result);

          if (result.success) {
            console.log(`✅ ${result.test}`);
          } else {
            console.error(`❌ ${result.test}`);
            console.error(result.error);
          }
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ ok: true }));
        })

        // report all results
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
  define: {
    'process.env.NODE_ENV': '"test"',
  },

  plugins: [testServer()],
});
