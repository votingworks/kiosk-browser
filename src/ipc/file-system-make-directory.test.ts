import { makeDirectory } from './file-system-make-directory'
import { promises as fs } from 'fs'

jest.mock('fs', () => ({
  promises: { mkdir: jest.fn() },
}))
const mkdirMock = fs.mkdir as jest.MockedFunction<typeof fs.mkdir>

test('fails if the origin has no write permission', async () => {
  await expect(
    makeDirectory([], 'evil.com', '/path/to/dir'),
  ).rejects.toThrowError('evil.com is not allowed to write to /path/to/dir')
})

test('fails given a non-absolute path', async () => {
  await expect(
    makeDirectory(
      [
        {
          origins: 'https://example.com',
          paths: '/path/to/**/*',
          access: 'rw',
        },
      ],
      'evil.com',
      'a/relative/path',
    ),
  ).rejects.toThrowError('requested path is not absolute: a/relative/path')
})

test('makes a directory non-recursively by default', async () => {
  mkdirMock.mockResolvedValueOnce()

  await makeDirectory(
    [
      {
        origins: 'https://example.com',
        paths: '/path/to/**/*',
        access: 'rw',
      },
    ],
    'https://example.com',
    '/path/to/dir',
  )

  expect(mkdirMock).toHaveBeenCalledWith('/path/to/dir', {})
})

test('makes a directory recursively if requested', async () => {
  mkdirMock.mockResolvedValueOnce()

  await makeDirectory(
    [
      {
        origins: 'https://example.com',
        paths: '/path/to/**/*',
        access: 'rw',
      },
    ],
    'https://example.com',
    '/path/to/dir',
    { recursive: true },
  )

  expect(mkdirMock).toHaveBeenCalledWith('/path/to/dir', { recursive: true })
})
