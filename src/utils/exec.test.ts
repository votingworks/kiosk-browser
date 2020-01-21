import { execFile } from 'child_process'
import exec from './exec'
import mockOf from '../../test/mockOf'

jest.mock('child_process', () => ({
  execFile: jest.fn(),
}))

const execFileMock = mockOf(execFile)

test('resolves to stdout and stderr', async () => {
  execFileMock.mockImplementation(((
    file: string,
    args: string[],
    callback: (error: Error | null, stdout: string, stderr: string) => void,
  ) => {
    callback(null, 'test', '')
  }) as any)

  expect(await exec('sh', ['-c', 'echo test'])).toEqual({
    stdout: 'test',
    stderr: '',
  })
})

test('rejects when an error occurs', async () => {
  execFileMock.mockImplementation(((
    file: string,
    args: string[],
    callback: (error: Error | null, stdout?: string, stderr?: string) => void,
  ) => {
    callback(new Error('NOPE'))
  }) as any)

  expect(exec('sh', ['-c', 'echo test'])).rejects.toThrowError('NOPE')
})
