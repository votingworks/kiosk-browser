/**
 * A mini testing framework for Electron integration testing.
 */

type TestFn = () => void | Promise<void>;
type HookFn = () => void | Promise<void>;

interface Test {
  name: string;
  fn: TestFn;
  skip?: boolean;
}

export interface TestModule {
  readonly path: string;
  readonly hooks: Map<string, HookFn[]>;
  readonly tests: Test[];
}

/**
 * A test result.
 */
export type TestResult =
  | { testModulePath: string; test: string; success: true; skipped?: boolean }
  | { testModulePath: string; test: string; success: false; error: Error };

const testModules: TestModule[] = [];
let currentTestModule: TestModule | undefined;

function addHook(name: string, fn: HookFn): void {
  if (!currentTestModule) {
    throw new Error('No test module is currently running');
  }

  const hooks = currentTestModule.hooks.get(name) ?? [];
  currentTestModule.hooks.set(name, [...hooks, fn]);
}

/**
 * Run the callback once before each test.
 */
export function beforeEach(fn: HookFn): void {
  addHook('beforeEach', fn);
}

/**
 * Run the callback once before all tests.
 */
export function beforeAll(fn: HookFn): void {
  addHook('beforeAll', fn);
}

/**
 * Run the callback once after each test.
 */
export function afterEach(fn: HookFn): void {
  addHook('afterEach', fn);
}

/**
 * Run the callback once after all tests.
 */
export function afterAll(fn: HookFn): void {
  addHook('afterAll', fn);
}

/**
 * Defines a test.
 */
export function test(name: string, fn: TestFn): void {
  if (!currentTestModule) {
    throw new Error('No test module is currently running');
  }

  currentTestModule.tests.push({ name, fn });
}

test.skip = (name: string, fn: TestFn): void => {
  if (!currentTestModule) {
    throw new Error('No test module is currently running');
  }

  currentTestModule.tests.push({ name, fn, skip: true });
};

/**
 * Calls `callback` until it runs without throwing an error or until `timeout`
 * is reached. Customize the interval between calls with `interval`, and the
 * timeout with `timeout`. If it succeeds, the returned promise will resolve.
 * If it fails, the returned promise will reject with the last error.
 */
export function waitFor(
  callback: () => void | Promise<void>,
  {
    interval: intervalMs = 10,
    timeout: timeoutMs = 5000,
  }: { interval?: number; timeout?: number } = {},
): Promise<void> {
  return new Promise((resolve, reject) => {
    let lastError: Error | undefined;
    let callbackPending = false;

    const interval = setInterval(() => {
      void (async () => {
        if (callbackPending) {
          return;
        }

        try {
          callbackPending = true;
          await callback();
          cleanup();
          resolve();
        } catch (error) {
          lastError = error as Error;
        } finally {
          callbackPending = false;
        }
      })();
    }, intervalMs);

    const timeout = setTimeout(() => {
      cleanup();
      if (lastError) {
        reject(lastError ?? new Error('waitFor timed out'));
      }
    }, timeoutMs);

    function cleanup() {
      if (interval) {
        clearInterval(interval);
      }
      if (timeout) {
        clearTimeout(timeout);
      }
    }
  });
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
 * Loads all given test modules.
 */
export async function loadTestModules(testModuleLoaders: {
  [key: string]: () => Promise<void>;
}): Promise<void> {
  for (const [testModulePath, loadTestModule] of Object.entries(
    testModuleLoaders,
  )) {
    currentTestModule = { path: testModulePath, hooks: new Map(), tests: [] };
    testModules.push(currentTestModule);
    await loadTestModule();
  }
}

/**
 * Runs named hooks and reports errors. Returns `true` if all hooks succeeded.
 */
async function runHooks(
  testModule: TestModule,
  hook: string,
): Promise<boolean> {
  try {
    await runHooksWithoutReporting(testModule, hook);
  } catch (error) {
    console.log(`❌ ${hook} failed`, error);
    await report({
      testModulePath: testModule.path,
      test: hook,
      success: false,
      error: error as Error,
    });
    return false;
  }
  return true;
}

/**
 * Run named hooks, but without reporting errors. Instead, errors are thrown.
 */
async function runHooksWithoutReporting(
  testModule: TestModule,
  hook: string,
): Promise<void> {
  for (const hookFn of testModule.hooks.get(hook) ?? []) {
    await hookFn();
  }
}

/**
 * Run a single test, i.e. the callback passed to `test()`, along with
 * `beforeEach`/`afterEach` hooks.
 */
async function runTest(testModule: TestModule, test: Test): Promise<boolean> {
  if (test.skip) {
    console.log(`⚠️ Skipping ${testModule.path} ${test.name}`);
    await report({
      testModulePath: testModule.path,
      test: test.name,
      success: true,
      skipped: true,
    });
    return true;
  }

  console.log(`running test ${test.name}`);
  try {
    await runHooksWithoutReporting(testModule, 'beforeEach');
    await test.fn();
    await runHooksWithoutReporting(testModule, 'afterEach');
    console.log(`✅ ${test.name} passed`);
    await report({
      testModulePath: testModule.path,
      test: test.name,
      success: true,
    });
  } catch (error) {
    console.error(`❌ ${test.name} failed`, error);
    await report({
      testModulePath: testModule.path,
      test: test.name,
      success: false,
      error: error as Error,
    });
    return false;
  }
  return true;
}

/**
 * Run all tests within a test module, including `beforeAll`/`afterAll` hooks.
 */
async function runTestModule(testModule: TestModule): Promise<void> {
  if (!(await runHooks(testModule, 'beforeAll'))) {
    return;
  }

  for (const test of testModule.tests) {
    await runTest(testModule, test);
  }

  await runHooksWithoutReporting(testModule, 'afterAll');
}

/**
 * Runs all test in all modules in the order they were defined.
 */
export async function runTests(): Promise<void> {
  for (const testModule of testModules) {
    await runTestModule(testModule);
  }

  await done();
}
