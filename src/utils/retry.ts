interface RetryOptions<T> {
  tries: number
  retryCondition?: (result: T) => boolean
}

/**
 * Retries a given function `options.tries` times. By default, it will retry
 * whenever an error is thrown.
 *
 * To retry based on the result of the function, pass in `options.retryCondition`,
 * which will be called with the function result. If `options.retryCondition`
 * returns true, the function will be retried.
 */
export async function retry<T>(
  options: RetryOptions<T>,
  action: () => Promise<T>,
): Promise<T> {
  const { tries, retryCondition } = options
  try {
    const result = await action()
    if (tries > 0 && retryCondition && retryCondition(result)) {
      return retry({ ...options, tries: tries - 1 }, action)
    }
    return result
  } catch (error) {
    if (tries > 0) {
      return retry({ ...options, tries: tries - 1 }, action)
    }
    throw error
  }
}
