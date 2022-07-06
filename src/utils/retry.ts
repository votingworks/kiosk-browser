interface RetryOptions {
  tries: number;
}

/**
 * Retries a given async function up to `options.tries` times if an error is
 * thrown.
 */
export function retry<T>(action: () => T, options: RetryOptions): T {
  const { tries } = options;
  if (tries <= 1) {
    throw Error('retry requires at least 2 tries');
  }
  function retryHelper(triesLeft: number): T {
    try {
      return action();
    } catch (error) {
      if (triesLeft > 0) {
        return retryHelper(triesLeft - 1);
      }
      throw error;
    }
  }
  return retryHelper(tries - 1);
}

interface RetryUntilOptions<T> extends RetryOptions {
  until: (result: T) => boolean;
  returnLastResult?: boolean;
}

export class NoMoreTries extends Error {}

/**
 * Like `retry`, but retries based on `options.until`, which will be called with
 * the function result. If `options.until` returns false, the function will be
 * retried.
 *
 * If the max number of tries is reached, NoMoreTries will be thrown. If
 * `options.returnLastResult` is true, then the last result will be returned
 * instead.
 */
export function retryUntil<T>(
  action: () => T,
  options: RetryUntilOptions<T>,
): T {
  const { until, tries, returnLastResult } = options;
  if (tries <= 1) {
    throw Error('retry requires at least 2 tries');
  }
  function retryHelper(triesLeft: number): T {
    const result = action();
    if (until(result)) {
      return result;
    }
    if (triesLeft > 0) {
      return retryHelper(triesLeft - 1);
    }
    if (returnLastResult) {
      return result;
    }
    throw new NoMoreTries();
  }
  return retryHelper(tries - 1);
}
