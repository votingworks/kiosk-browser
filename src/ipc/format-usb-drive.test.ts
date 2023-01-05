import { fakeIpc } from '../../test/ipc';
import mockOf from '../../test/mockOf';
import exec from '../utils/exec';
import register, { channel } from './format-usb-drive';

const execMock = mockOf(exec);

jest.mock('../utils/exec');

test('fat32 - happy path', async () => {
  // Register our handler.
  const { ipcMain, ipcRenderer } = fakeIpc();
  register(ipcMain);

  execMock.mockResolvedValue({
    stdout: '',
    stderr: '',
  });

  await ipcRenderer.invoke(channel, 'sdb1', {
    format: 'fat32',
    name: 'maxlen-name',
  });

  expect(execMock).toHaveBeenNthCalledWith(
    1,
    'sudo',
    expect.objectContaining([
      '-n',
      'sfdisk',
      '--wipe',
      'always',
      '--wipe-partitions',
      'always',
      '/dev/sdb',
    ]),
    'type=c',
  );
  expect(execMock).toHaveBeenNthCalledWith(
    2,
    'sudo',
    expect.objectContaining([
      '-n',
      'mkfs.fat',
      '-F',
      '32',
      '-n',
      'maxlen-name',
      '/dev/sdb1',
    ]),
  );
  expect(execMock).toBeCalledTimes(2);
});

test('exfat - happy path', async () => {
  // Register our handler.
  const { ipcMain, ipcRenderer } = fakeIpc();
  register(ipcMain);

  execMock.mockResolvedValue({
    stdout: '',
    stderr: '',
  });

  await ipcRenderer.invoke(channel, 'sdb1', {
    format: 'exfat',
    name: 'max-length-name',
  });

  expect(execMock).toHaveBeenNthCalledWith(
    1,
    'sudo',
    expect.objectContaining([
      '-n',
      'sfdisk',
      '--wipe',
      'always',
      '--wipe-partitions',
      'always',
      '/dev/sdb',
    ]),
    'type=7',
  );
  expect(execMock).toHaveBeenNthCalledWith(
    2,
    'sudo',
    expect.objectContaining([
      '-n',
      'mkfs.exfat',
      '-n',
      'max-length-name',
      '/dev/sdb1',
    ]),
  );
  expect(execMock).toBeCalledTimes(2);
});

test('fat32 - name too long throws error', async () => {
  // Register our handler.
  const { ipcMain, ipcRenderer } = fakeIpc();
  register(ipcMain);

  await expect(
    ipcRenderer.invoke(channel, 'sdb1', {
      format: 'fat32',
      name: 'too-long-name',
    }),
  ).rejects.toThrowError(/longer than allowed/);
});

test('exfat - name too long throws error', async () => {
  // Register our handler.
  const { ipcMain, ipcRenderer } = fakeIpc();
  register(ipcMain);

  await expect(
    ipcRenderer.invoke(channel, 'sdb1', {
      format: 'exfat',
      name: 'name-is-way-too-long',
    }),
  ).rejects.toThrowError(/longer than allowed/);
});

test('throws error if uninterpretable device name', async () => {
  const { ipcMain, ipcRenderer } = fakeIpc();
  register(ipcMain);

  await expect(
    ipcRenderer.invoke(channel, 'disk1part1', {
      format: 'exfat',
      name: 'test',
    }),
  ).rejects.toThrowError();
});

test('throws error if device is mounted', async () => {
  const { ipcMain, ipcRenderer } = fakeIpc();
  register(ipcMain);

  execMock.mockRejectedValueOnce({
    stdout: 'Checking that no-one is using this disk right now ... FAILED',
    stderr:
      'This disk is currently in use - repartitioning is probably a bad idea.',
  });

  await expect(
    ipcRenderer.invoke(channel, 'sdb1', {
      format: 'exfat',
      name: 'test',
    }),
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    '"Cannot reformat drive while it is in use. Make sure to unmount the drive first."',
  );
});
