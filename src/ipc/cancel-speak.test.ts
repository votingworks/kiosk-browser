import { IpcMain, IpcMainEvent } from 'electron';
import { fakeIpc } from '../../test/ipc';
import mockOf from '../../test/mockOf';
import deferred from '../../test/deferred';
import exec from '../utils/exec';
import register, { channel } from './cancel-speak';

const execMock = mockOf(exec);

jest.mock('../utils/exec');

test('cancel-speak', async () => {
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
  await handler({} as IpcMainEvent);

  expect(execMock).toHaveBeenCalledWith('spd-say', ['-C']);
});

test('does not duplicate request to cancel speech if job already exists', async () => {
  const { ipcMain, ipcRenderer } = fakeIpc();
  register(ipcMain);

  const { promise, resolve } = deferred<{ stdout: string; stderr: string }>();
  execMock.mockReturnValueOnce(promise);

  const firstCancel = ipcRenderer.invoke(channel);
  const secondCancel = ipcRenderer.invoke(channel);
  resolve({ stdout: '', stderr: '' });
  await firstCancel;
  await secondCancel;

  expect(execMock).toBeCalledTimes(1);
});
