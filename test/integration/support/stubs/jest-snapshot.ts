/**
 * Provides a stub for the `jest-snapshot` module in integration tests that
 * doesn't actually work, so we can't use snapshot tests in the integration
 * tests.
 */

/**
 * Stub for `jest-snapshot` module `toMatchInlineSnapshot()` function.
 */
export function toMatchInlineSnapshot() {
  throw new Error(
    'toMatchInlineSnapshot is not supported in integration tests',
  );
}

/**
 * Stub for `jest-snapshot` module `toMatchSnapshot()` function.
 */
export function toMatchSnapshot() {
  throw new Error('toMatchSnapshot is not supported in integration tests');
}

/**
 * Stub for `jest-snapshot` module `toThrowErrorMatchingInlineSnapshot()` function.
 */
export function toThrowErrorMatchingInlineSnapshot() {
  throw new Error(
    'toThrowErrorMatchingInlineSnapshot is not supported in integration tests',
  );
}

/**
 * Stub for `jest-snapshot` module `toThrowErrorMatchingSnapshot` function.
 */
export function toThrowErrorMatchingSnapshot() {
  throw new Error(
    'toThrowErrorMatchingSnapshot is not supported in integration tests',
  );
}
