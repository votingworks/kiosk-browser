import { IpcMain, IpcMainEvent } from 'electron';
import mockOf from '../../test/mockOf';
import execSync from '../utils/execSync';
import register, { channel } from './unmount-usb-drive';

const execSyncMock = mockOf(execSync);

jest.mock('../utils/execSync');

test('mount-usb-drive', async () => {
  // Register our handler.
  const handle = jest.fn<
    ReturnType<IpcMain['handle']>,
    Parameters<IpcMain['handle']>
  >();
  register({ handle } as unknown as IpcMain);

  // Things should be registered as expected.
  expect(handle).toHaveBeenCalledWith(channel, expect.any(Function));

  execSyncMock.mockReturnValueOnce({
    stdout: '',
    stderr: '',
  });

  // Is the handler wired up right?
  const [, handler] = handle.mock.calls[0];
  await handler({} as IpcMainEvent, 'sdb1');

  expect(execSyncMock).toHaveBeenCalledWith('pumount', ['/dev/sdb1']);
});
