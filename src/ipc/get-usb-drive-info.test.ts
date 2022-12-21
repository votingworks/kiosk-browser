import { IpcMain, IpcMainEvent } from 'electron';
import { promises as fs } from 'fs';
import mockOf from '../../test/mockOf';
import exec from '../utils/exec';
import register, { channel } from './get-usb-drive-info';

const execMock = mockOf(exec);
const accessMock = fs.access as unknown as jest.Mock<Promise<void>>;
const readdirMock = fs.readdir as unknown as jest.Mock<Promise<string[]>>;
const readlinkMock = fs.readlink as unknown as jest.Mock<Promise<string>>;

jest.mock('fs', () => ({
  promises: {
    access: jest.fn(),
    readdir: jest.fn(),
    readlink: jest.fn(),
  },
}));
jest.mock('../utils/exec');

test('get-usb-drives', async () => {
  // Register our handler.
  const handle = jest.fn<
    ReturnType<IpcMain['handle']>,
    Parameters<IpcMain['handle']>
  >();
  register({ handle } as unknown as IpcMain);

  // Things should be registered as expected.
  expect(handle).toHaveBeenCalledWith(channel, expect.any(Function));

  readdirMock.mockResolvedValueOnce([
    'usb-foobar-part23',
    'notausb-bazbar-part21',
    'usb-babar-part3',
  ]);
  readlinkMock.mockResolvedValueOnce('../../sdb1');
  readlinkMock.mockResolvedValueOnce('../../sdc1');
  execMock.mockResolvedValueOnce({
    stdout: JSON.stringify({
      blockdevices: [
        {
          name: 'sdb1',
          mountpoint: '/media/usb-drive-sdb1',
          fstype: 'vfat',
          fsver: 'FAT32',
        },
      ],
    }),
    stderr: '',
  });
  execMock.mockResolvedValueOnce({
    stdout: JSON.stringify({
      blockdevices: [
        {
          name: 'sdc1',
          mountpoint: null,
          fstype: 'exfat',
          fsver: '1.0',
        },
      ],
    }),
    stderr: '',
  });

  execMock.mockResolvedValueOnce({
    stdout: JSON.stringify({
      filesystems: [
        {
          target: '/media/usb-drive-sdb1',
          source: '/dev/sdb1',
        },
        {
          target: '/media/usb-drive-sdz1',
          source: '/dev/sdz1',
        },
        {
          target: 'something',
          source: 'random',
        },
      ],
    }),
    stderr: '',
  });

  accessMock.mockResolvedValueOnce().mockRejectedValueOnce(new Error('ENOENT'));

  // Is the handler wired up right?
  const [, handler] = handle.mock.calls[0];
  const devices = (await handler(
    {} as IpcMainEvent,
  )) as KioskBrowser.UsbDriveInfo[];

  expect(execMock).toHaveBeenCalledTimes(4);
  expect(execMock).toHaveBeenNthCalledWith(4, 'pumount', [
    '/media/usb-drive-sdz1',
  ]);
  expect(devices).toEqual([
    {
      deviceName: 'sdb1',
      mountPoint: '/media/usb-drive-sdb1',
      fsType: 'vfat',
      fsVersion: 'FAT32',
    },
    { deviceName: 'sdc1', fsType: 'exfat', fsVersion: '1.0' },
  ]);
});

test('get-usb-drives works when findmnt returns nothing', async () => {
  // Register our handler.
  const handle = jest.fn<
    ReturnType<IpcMain['handle']>,
    Parameters<IpcMain['handle']>
  >();
  register({ handle } as unknown as IpcMain);

  // Things should be registered as expected.
  expect(handle).toHaveBeenCalledWith(channel, expect.any(Function));

  readdirMock.mockResolvedValueOnce(['usb-foobar-part23']);
  readlinkMock.mockResolvedValueOnce('../../sdb1');
  execMock.mockResolvedValueOnce({
    stdout: JSON.stringify({
      blockdevices: [
        {
          name: 'sdb1',
          mountpoint: '/media/usb-drive-sdb1',
          fstype: 'vfat',
          fsver: 'FAT32',
        },
      ],
    }),
    stderr: '',
  });

  execMock.mockResolvedValueOnce({
    stdout: '',
    stderr: '',
  });

  // Is the handler wired up right?
  const [, handler] = handle.mock.calls[0];
  const devices = (await handler(
    {} as IpcMainEvent,
  )) as KioskBrowser.UsbDriveInfo[];

  expect(execMock).toHaveBeenCalledTimes(2);
  expect(execMock).toHaveBeenCalledWith('findmnt', ['--json', '--list']);
  expect(devices).toEqual([
    {
      deviceName: 'sdb1',
      mountPoint: '/media/usb-drive-sdb1',
      fsType: 'vfat',
      fsVersion: 'FAT32',
    },
  ]);
});
