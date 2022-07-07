import { retry, NoMoreTries, retryUntil } from './retry';

describe('retry', () => {
  it('returns the result of the action if it succeeds', () => {
    const action = jest.fn().mockReturnValueOnce('result');
    expect(retry(action, { tries: 2 })).toEqual('result');
  });

  it('retries the action if it fails, then returns a later successful result', () => {
    const action = jest
      .fn()
      .mockImplementationOnce(() => {
        throw new Error('error');
      })
      .mockReturnValueOnce('result');
    expect(retry(action, { tries: 2 })).toEqual('result');
  });

  it('retries the action if it fails up to options.tries times, then throws the last error', () => {
    const action = jest
      .fn()
      .mockImplementationOnce(() => {
        throw new Error('error 1');
      })
      .mockImplementationOnce(() => {
        throw new Error('error 2');
      })
      .mockImplementationOnce(() => {
        throw new Error('error 3');
      });
    expect(() => {
      retry(action, { tries: 3 });
    }).toThrow('error 3');
  });

  it('requires at least 2 tries', () => {
    const action = jest.fn();
    expect(() => {
      retry(action, { tries: 1 });
    }).toThrow('retry requires at least 2 tries');
  });
});

describe('retryUntil', () => {
  it('uses options.until to test for action success', () => {
    const action = jest
      .fn()
      .mockReturnValueOnce('fail')
      .mockReturnValueOnce('success');
    expect(
      retryUntil(action, {
        tries: 3,
        until: (result) => result === 'success',
      }),
    ).toEqual('success');
  });

  it('if options.until never passes, throws NoMoreTries', () => {
    const action = jest
      .fn()
      .mockReturnValueOnce('fail')
      .mockReturnValueOnce('fail');
    expect(() => {
      retryUntil(action, {
        tries: 2,
        until: (result) => result === 'success',
      });
    }).toThrow(NoMoreTries);
  });

  it('if options.until never passes but options.returnLastResult is true, returns result of last action call', () => {
    const action = jest
      .fn()
      .mockReturnValueOnce('fail')
      .mockReturnValueOnce('success');
    expect(
      retryUntil(action, {
        tries: 2,
        until: (result) => result === 'smashing success',
        returnLastResult: true,
      }),
    ).toEqual('success');
  });

  it('throws on any errors', () => {
    const action = jest.fn().mockImplementation(() => {
      throw new Error('some other error');
    });
    expect(() => {
      retryUntil(action, { tries: 2, until: () => true });
    }).toThrow('some other error');
  });

  it('requires at least 2 tries', () => {
    const action = jest.fn();
    expect(() => {
      retryUntil(action, { tries: 1, until: () => true });
    }).toThrow('retry requires at least 2 tries');
  });
});
