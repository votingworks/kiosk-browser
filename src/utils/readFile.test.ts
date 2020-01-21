import * as fs from 'fs'
import readFile from './readFile'
import mockOf from '../../test/mockOf'

jest.mock('fs', () => ({
  readFile: jest.fn(),
}))

const readFileMock = mockOf(fs.readFile)

test('wraps execFile in promisify', async () => {
  readFileMock.mockImplementation(((
    path: string,
    encoding: string,
    callback: any,
  ) => {
    callback(null, 'file content')
  }) as any)

  expect(await readFile('/tmp/foo')).toEqual('file content')
})

test('rejects when an error occurs', async () => {
  readFileMock.mockImplementation(((
    path: string,
    encoding: string,
    callback: any,
  ) => {
    callback(new Error('ENOENT'))
  }) as any)

  expect(readFile('/tmp/foo')).rejects.toThrowError('ENOENT')
})
