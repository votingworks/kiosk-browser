import { retry } from './retry'

describe('retry', () => {
  it('returns the result of the action if it succeeds', async () => {
    const action = jest.fn().mockResolvedValueOnce('result')
    expect(await retry({ tries: 2 }, action)).toEqual('result')
  })

  it('retries the action if it fails, then returns a later successful result', async () => {
    const action = jest
      .fn()
      .mockRejectedValueOnce('error')
      .mockResolvedValueOnce('result')
    expect(await retry({ tries: 2 }, action)).toEqual('result')
  })

  it('retries the action if it fails up to options.tries times, then throws the last error', async () => {
    const action = jest
      .fn()
      .mockRejectedValueOnce(new Error('error 1'))
      .mockRejectedValueOnce(new Error('error 2'))
      .mockRejectedValueOnce(new Error('error 3'))
    await expect(retry({ tries: 3 }, action)).rejects.toThrow('error 3')
  })

  it('if options.retryCondition given, uses it to tests for action success', async () => {
    const action = jest
      .fn()
      .mockResolvedValueOnce('fail')
      .mockResolvedValueOnce('success')
    expect(
      await retry(
        { tries: 3, retryCondition: result => result !== 'success' },
        action,
      ),
    ).toEqual('success')
  })

  it('if options.retryCondition given, but never passes, returns the last result', async () => {
    const action = jest
      .fn()
      .mockResolvedValueOnce('fail')
      .mockResolvedValueOnce('success')
    expect(
      await retry(
        { tries: 2, retryCondition: result => result !== 'smashing success' },
        action,
      ),
    ).toEqual('success')
  })

  it('requires at least 2 tries', async () => {
    const action = jest.fn()
    await expect(retry({ tries: 1 }, action)).rejects.toThrow(
      'retry requires at least 2 tries',
    )
  })
})
