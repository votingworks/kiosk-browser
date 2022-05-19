import { promises as fs } from 'fs';
import { fakeIpc } from '../../test/ipc';
import register, {
  channel as fileSystemReadFileChannel,
  readFile,
} from './file-system-read-file';

test('fails when read permission is not present', async () => {
  await expect(
    readFile('https://example.com', [], '/a/path', 'utf8'),
  ).rejects.toThrowError(
    new Error('https://example.com is not allowed to read /a/path'),
  );
});

test('fails when the file path is not absolute', async () => {
  await expect(
    readFile('https://example.com', [], 'some/relative/path', 'utf8'),
  ).rejects.toThrowError(
    new Error('requested path is not absolute: some/relative/path'),
  );
});

test('read files with an encoding', async () => {
  jest.spyOn(fs, 'readFile').mockResolvedValueOnce('file content as a string');

  expect(
    await readFile(
      'https://example.com',
      [{ origins: 'https://example.com', paths: '/a/path/**/*', access: 'ro' }],
      '/a/path/to/file.txt',
      'utf8',
    ),
  ).toEqual('file content as a string');

  expect(fs.readFile).toHaveBeenCalledWith('/a/path/to/file.txt', {
    encoding: 'utf8',
  });
});

test('read files without an encoding', async () => {
  jest.spyOn(fs, 'readFile').mockResolvedValueOnce(Buffer.of(1, 2, 3));

  expect(
    await readFile(
      'https://example.com',
      [{ origins: 'https://example.com', paths: '/a/path/**/*', access: 'ro' }],
      '/a/path/to/file.png',
    ),
  ).toEqual(Buffer.of(1, 2, 3));

  expect(fs.readFile).toHaveBeenCalledWith('/a/path/to/file.png', {
    encoding: undefined,
  });
});

test('registers a handler to read files', async () => {
  const { ipcMain, ipcRenderer } = fakeIpc();

  register(ipcMain, {
    options: {
      originFilePermissions: [
        {
          origins: 'https://example.com',
          paths: '**/*',
          access: 'ro',
        },
      ],
      url: new URL('https://example.com/'),
    },
  });

  jest.spyOn(fs, 'readFile').mockResolvedValueOnce('hello world');

  expect(
    await ipcRenderer.invoke(fileSystemReadFileChannel, '/a/path', 'utf8'),
  ).toEqual('hello world');

  expect(fs.readFile).toHaveBeenCalledWith('/a/path', { encoding: 'utf8' });
});
