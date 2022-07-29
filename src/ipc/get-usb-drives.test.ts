import { IpcMain, IpcMainEvent } from 'electron';
import { promises as fs } from 'fs';
import mockOf from '../../test/mockOf';
import execSync from '../utils/execSync';
import register, { channel, UsbDrive } from './get-usb-drives';

const execSyncMock = mockOf(execSync);
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
jest.mock('../utils/execSync');

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
  execSyncMock.mockReturnValueOnce({
    stdout: JSON.stringify({
      blockdevices: [
        {
          name: 'sdb1',
          'maj:min': '8:3',
          rm: '0',
          size: '93.9M',
          ro: '1',
          type: 'part',
          mountpoint: '/media/usb-drive-sdb1',
        },
      ],
    }),
    stderr: '',
  });
  execSyncMock.mockReturnValueOnce({
    stdout: JSON.stringify({
      blockdevices: [
        {
          name: 'sdc1',
          'maj:min': '8:3',
          rm: '0',
          size: '73.2M',
          ro: '1',
          type: 'part',
          mountpoint: null,
        },
      ],
    }),
    stderr: '',
  });

  execSyncMock.mockReturnValueOnce({
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
  const devices = (await handler({} as IpcMainEvent)) as UsbDrive[];

  expect(execSyncMock).toHaveBeenCalledTimes(4);
  expect(execSyncMock).toHaveBeenNthCalledWith(4, 'pumount', [
    '/media/usb-drive-sdz1',
  ]);
  expect(devices).toEqual([
    { deviceName: 'sdb1', mountPoint: '/media/usb-drive-sdb1' },
    { deviceName: 'sdc1' },
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
  execSyncMock.mockReturnValueOnce({
    stdout: JSON.stringify({
      blockdevices: [
        {
          name: 'sdb1',
          'maj:min': '8:3',
          rm: '0',
          size: '93.9M',
          ro: '1',
          type: 'part',
          mountpoint: '/media/usb-drive-sdb1',
        },
      ],
    }),
    stderr: '',
  });

  execSyncMock.mockReturnValueOnce({
    stdout: '',
    stderr: '',
  });

  // Is the handler wired up right?
  const [, handler] = handle.mock.calls[0];
  const devices = (await handler({} as IpcMainEvent)) as UsbDrive[];

  expect(execSyncMock).toHaveBeenCalledTimes(2);
  expect(execSyncMock).toHaveBeenCalledWith('findmnt', ['--json', '--list']);
  expect(devices).toEqual([
    { deviceName: 'sdb1', mountPoint: '/media/usb-drive-sdb1' },
  ]);
});
