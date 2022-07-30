import { IpcMain, IpcMainEvent } from 'electron';
import mockOf from '../../test/mockOf';
import exec from '../utils/exec';
import register, { channel } from './sync-usb-drive';

const execMock = mockOf(exec);

jest.mock('../utils/exec');

test('sync-usb-drive', async () => {
  // Register our handler.
  const handle = jest.fn<
    ReturnType<IpcMain['handle']>,
    Parameters<IpcMain['handle']>
  >();
  register({ handle } as unknown as IpcMain);

  // Things should be registered as expected.
  expect(handle).toHaveBeenCalledWith(channel, expect.any(Function));

  // Is the handler wired up right?
  const [, handler] = handle.mock.calls[0];
  await handler({} as IpcMainEvent, '/media/vx/drive');

  expect(execMock).toHaveBeenCalledWith('sync', ['-f', '/media/vx/drive']);
});
