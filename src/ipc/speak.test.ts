import { IpcMain, IpcMainEvent } from 'electron';
import { fakeIpc } from '../../test/ipc';
import mockOf from '../../test/mockOf';
import exec from '../utils/exec';
import register, { channel } from './speak';

const execMock = mockOf(exec);

jest.mock('../utils/exec');

beforeEach(() => {
  execMock.mockReset();
});

test('speak', async () => {
  // Register our handler.
  const handle = jest.fn<
    ReturnType<IpcMain['handle']>,
    Parameters<IpcMain['handle']>
  >();
  register({ handle } as unknown as IpcMain);

  // Things should be registered as expected.
  expect(handle).toHaveBeenCalledWith(channel, expect.any(Function));
  const [, handler] = handle.mock.calls[0];

  await handler({} as IpcMainEvent, 'hello world', { volume: 67 });
  // Calls amixer and passes our our provided volume.
  expect(execMock).toHaveBeenNthCalledWith(1, 'amixer', [
    '-q',
    '-D',
    'pulse',
    'sset',
    'Master',
    '67%',
  ]);
  // Calls spd-say with our provided text.
  expect(execMock).toHaveBeenNthCalledWith(2, 'spd-say', ['-w', 'hello world']);
});

test('throws error if called with invalid volume setting', async () => {
  const { ipcMain, ipcRenderer } = fakeIpc();
  register(ipcMain);

  await expect(
    ipcRenderer.invoke(channel, 'hello world', { volume: 120 }),
  ).rejects.toThrowError();

  expect(execMock).not.toHaveBeenCalled();
});
