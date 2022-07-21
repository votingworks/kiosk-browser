import { IpcMain, IpcMainEvent } from 'electron';
import mockOf from '../../test/mockOf';
import promisifiedExec from '../utils/promisifiedExec';
import register, { channel } from './sync-usb-drive';

const promisifiedExecMock = mockOf(promisifiedExec);

jest.mock('../utils/promisifiedExec');

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

  expect(promisifiedExecMock).toHaveBeenCalledWith('sync -f /media/vx/drive');
});
