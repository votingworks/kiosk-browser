/**
 * A mini testing framework for Electron integration testing.
 */

type TestFn = () => void | Promise<void>;

interface Test {
  name: string;
  fn: TestFn;
}

/**
 * A test result.
 */
export type TestResult =
  | { test: string; success: true }
  | { test: string; success: false; error: Error };

const tests: Test[] = [];

/**
 * Defines a test.
 */
export function test(name: string, fn: TestFn): void {
  tests.push({ name, fn });
}

/**
 * Reports a test result.
 */
async function report(result: TestResult): Promise<void> {
  await fetch('/minitest/results', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(result),
  });
}

/**
 * Called when all tests have finished.
 */
async function done(): Promise<void> {
  await fetch('/minitest/done', {
    method: 'POST',
  });
}

/**
 * Runs all tests in the order they were defined.
 */
function startTests(): void {
  const testsToRun = tests.slice();

  async function runNextTest(): Promise<void> {
    if (testsToRun.length === 0) {
      await done();
      return;
    }

    const test = testsToRun.shift() as Test;

    try {
      await test.fn();
      console.log(`✅ ${test.name} passed`);
      await report({ test: test.name, success: true });
    } catch (error) {
      console.error(`❌ ${test.name} failed`);
      console.error(error);
      await report({ test: test.name, success: false, error: error as Error });
    } finally {
      void runNextTest();
    }
  }

  void runNextTest();
}

// Automatically run tests when the page is ready.
document.addEventListener('DOMContentLoaded', () => {
  startTests();
});
