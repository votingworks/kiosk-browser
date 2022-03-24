import { retry, NoMoreTries, retryUntil } from './retry'

describe('retry', () => {
  it('returns the result of the action if it succeeds', async () => {
    const action = jest.fn().mockResolvedValueOnce('result')
    expect(await retry(action, { tries: 2 })).toEqual('result')
  })

  it('retries the action if it fails, then returns a later successful result', async () => {
    const action = jest
      .fn()
      .mockRejectedValueOnce('error')
      .mockResolvedValueOnce('result')
    expect(await retry(action, { tries: 2 })).toEqual('result')
  })

  it('retries the action if it fails up to options.tries times, then throws the last error', async () => {
    const action = jest
      .fn()
      .mockRejectedValueOnce(new Error('error 1'))
      .mockRejectedValueOnce(new Error('error 2'))
      .mockRejectedValueOnce(new Error('error 3'))
    await expect(retry(action, { tries: 3 })).rejects.toThrow('error 3')
  })

  it('requires at least 2 tries', async () => {
    const action = jest.fn()
    await expect(retry(action, { tries: 1 })).rejects.toThrow(
      'retry requires at least 2 tries',
    )
  })
})

describe('retryUntil', () => {
  it('uses options.until to test for action success', async () => {
    const action = jest
      .fn()
      .mockResolvedValueOnce('fail')
      .mockResolvedValueOnce('success')
    expect(
      await retryUntil(action, {
        tries: 3,
        until: result => result === 'success',
      }),
    ).toEqual('success')
  })

  it('if options.until never passes, throws NoMoreTries', async () => {
    const action = jest
      .fn()
      .mockResolvedValueOnce('fail')
      .mockResolvedValueOnce('fail')
    await expect(
      retryUntil(action, {
        tries: 2,
        until: result => result === 'success',
      }),
    ).rejects.toThrow(NoMoreTries)
  })

  it('if options.until never passes but options.returnLastResult is true, returns result of last action call', async () => {
    const action = jest
      .fn()
      .mockResolvedValueOnce('fail')
      .mockResolvedValueOnce('success')
    expect(
      await retryUntil(action, {
        tries: 2,
        until: result => result === 'smashing success',
        returnLastResult: true,
      }),
    ).toEqual('success')
  })

  it('throws on any errors', async () => {
    const action = jest.fn().mockRejectedValue(new Error('some other error'))
    await expect(
      retryUntil(action, { tries: 2, until: () => true }),
    ).rejects.toThrow('some other error')
  })

  it('requires at least 2 tries', async () => {
    const action = jest.fn()
    await expect(
      retryUntil(action, { tries: 1, until: () => true }),
    ).rejects.toThrow('retry requires at least 2 tries')
  })
})
