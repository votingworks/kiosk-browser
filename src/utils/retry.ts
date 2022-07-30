interface RetryOptions {
  tries: number;
}

/**
 * Retries a given async function up to `options.tries` times if an error is
 * thrown.
 */
export async function retry<T>(
  action: () => Promise<T>,
  options: RetryOptions,
): Promise<T> {
  const { tries } = options;
  if (tries <= 1) {
    throw Error('retry requires at least 2 tries');
  }
  async function retryHelper(triesLeft: number): Promise<T> {
    try {
      return await action();
    } catch (error) {
      if (triesLeft > 0) {
        return retryHelper(triesLeft - 1);
      }
      throw error;
    }
  }
  return await retryHelper(tries - 1);
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
export async function retryUntil<T>(
  action: () => Promise<T>,
  options: RetryUntilOptions<T>,
): Promise<T> {
  const { until, tries, returnLastResult } = options;
  if (tries <= 1) {
    throw Error('retry requires at least 2 tries');
  }
  async function retryHelper(triesLeft: number): Promise<T> {
    const result = await action();
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
  return await retryHelper(tries - 1);
}
