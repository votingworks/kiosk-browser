import { IpcMain, IpcMainEvent } from 'electron';
import mockOf from '../../test/mockOf';
import exec from '../utils/exec';
import register, { channel } from './unmount-usb-drive';

const execMock = mockOf(exec);

jest.mock('../utils/exec');

test('mount-usb-drive', async () => {
  // Register our handler.
  const handle = jest.fn<
    ReturnType<IpcMain['handle']>,
    Parameters<IpcMain['handle']>
  >();
  register({ handle } as unknown as IpcMain);

  // Things should be registered as expected.
  expect(handle).toHaveBeenCalledWith(channel, expect.any(Function));

  execMock.mockResolvedValueOnce({
    stdout: '',
    stderr: '',
  });

  // Is the handler wired up right?
  const [, handler] = handle.mock.calls[0];
  await handler({} as IpcMainEvent, 'sdb1');

  expect(execMock).toHaveBeenCalledWith('pumount', ['/dev/sdb1']);
});
