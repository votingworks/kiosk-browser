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
  if (tries <= 1) {
    throw Error('retry requires at least 2 tries')
  }
  async function retryHelper(triesLeft: number): Promise<T> {
    try {
      const result = await action()
      if (triesLeft > 0 && retryCondition && retryCondition(result)) {
        return retryHelper(triesLeft - 1)
      }
      return result
    } catch (error) {
      if (triesLeft > 0) {
        return retryHelper(triesLeft - 1)
      }
      throw error
    }
  }
  return await retryHelper(tries - 1)
}
