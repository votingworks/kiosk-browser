import { spawn, ChildProcessWithoutNullStreams } from 'child_process'
import exec from './exec'
import mockOf from '../../test/mockOf'
import { EventEmitter } from 'events'
import MemoryStream from 'memorystream'

jest.mock('child_process')

type FakeChildProcess = ChildProcessWithoutNullStreams & {
  endStdout(data?: string | Buffer): Promise<void>
  endStderr(data?: string | Buffer): Promise<void>
}

function fakeChildProcess(stdinData?: string | Buffer): FakeChildProcess {
  const result = new EventEmitter() as FakeChildProcess
  const stdin = new MemoryStream(stdinData)
  const stdout = new MemoryStream()
  const stderr = new MemoryStream()

  Object.defineProperties(result, {
    stdin: {
      value: stdin,
    },

    stdout: {
      value: stdout,
    },

    stderr: {
      value: stderr,
    },

    endStdout: {
      value: async (data?: string | Buffer): Promise<void> =>
        new Promise(resolve => {
          stdout.end(data, () => {
            resolve()
          })
        }),
    },

    endStderr: {
      value: async (data?: string | Buffer): Promise<void> =>
        new Promise(resolve => {
          stderr.end(data, () => {
            resolve()
          })
        }),
    },
  })

  return result
}

test('command with no args', async () => {
  // Set up child process.
  const child = fakeChildProcess()
  mockOf(spawn).mockReturnValueOnce(child)

  // Start and finish child process.
  const execPromise = exec('ls')
  child.emit('exit', 0, null)

  // Check the results.
  expect(await execPromise).toEqual({ stdout: '', stderr: '' })
  expect(spawn).toHaveBeenCalledWith('ls', [])
})

test('command with args', async () => {
  // Set up child process.
  const child = fakeChildProcess()
  mockOf(spawn).mockReturnValueOnce(child)

  // Start and finish child process.
  const execPromise = exec('ls', ['-la'])
  child.emit('exit', 0, null)

  // Check the results.
  expect(await execPromise).toEqual({ stdout: '', stderr: '' })
  expect(spawn).toHaveBeenCalledWith('ls', ['-la'])
})

test('command printing stdout', async () => {
  // Set up child process.
  const child = fakeChildProcess()
  mockOf(spawn).mockReturnValueOnce(child)

  // Start and finish child process.
  const execPromise = exec('ls', ['-la'])
  await child.endStdout('README.md\n')
  child.emit('exit', 0, null)

  // Check the results.
  expect(await execPromise).toEqual({ stdout: 'README.md\n', stderr: '' })
  expect(spawn).toHaveBeenCalledWith('ls', ['-la'])
})

test('failed command printing stderr', async () => {
  // Set up child process.
  const child = fakeChildProcess()
  mockOf(spawn).mockReturnValueOnce(child)

  // Start and finish child process.
  const execPromise = exec('ls', ['-x'])
  await child.endStderr('unknown option "-x"')
  child.emit('exit', 1, null)

  // Check the results.
  await expect(execPromise).rejects.toThrowError(
    expect.objectContaining({ stderr: 'unknown option "-x"', code: 1 }),
  )
  expect(spawn).toHaveBeenCalledWith('ls', ['-x'])
})

test('failed command printing stderr', async () => {
  // Set up child process.
  const child = fakeChildProcess()
  mockOf(spawn).mockReturnValueOnce(child)

  // Start and finish child process.
  const execPromise = exec('ls', ['-x'])
  await child.endStderr('unknown option "-x"')
  child.emit('exit', 1, null)

  // Check the results.
  await expect(execPromise).rejects.toThrowError(
    expect.objectContaining({
      stdout: '',
      stderr: 'unknown option "-x"',
      code: 1,
    }),
  )
  expect(spawn).toHaveBeenCalledWith('ls', ['-x'])
})

test('command with stdin', async () => {
  // Set up child process.
  const child = fakeChildProcess()
  mockOf(spawn).mockReturnValueOnce(child)
  child.stdin.write = jest.fn()
  child.stdin.end = jest.fn()

  // Start and finish child process.
  const execPromise = exec('lpr', ['-P', 'VxPrinter'], 'foobarbaz to print')
  child.emit('exit', 0, null)
  await execPromise

  // Check the results.
  expect(child.stdin.write).toHaveBeenCalledWith('foobarbaz to print')
  expect(child.stdin.end).toHaveBeenCalled()
})
