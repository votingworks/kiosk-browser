import { mockHandlerContext } from '../../test/mockHandlerContext';
import { fakeIpc } from '../../test/ipc';
import mockOf from '../../test/mockOf';
import exec from '../utils/exec';
import register, { channel } from './mount-usb-drive';

const execMock = mockOf(exec);

jest.mock('../utils/exec');

test('mount-usb-drive', async () => {
  const { ipcMain, ipcRenderer } = fakeIpc();
  register(ipcMain, mockHandlerContext());

  // Things should be registered as expected.
  execMock.mockResolvedValueOnce({
    stdout: '',
    stderr: '',
  });

  await ipcRenderer.invoke(channel, 'sdb1');
  expect(execMock).toHaveBeenCalledWith('sudo', [
    '-n',
    '/tmp/mount.sh',
    '/dev/sdb1',
  ]);
});

test('mount-usb-drive does nothing if no app scripts directory was provided', async () => {
  // Register our handler.
  const { ipcMain, ipcRenderer } = fakeIpc();
  register(
    ipcMain,
    mockHandlerContext({ options: { appScriptsDirectory: undefined } }),
  );

  // Things should be registered as expected.
  execMock.mockResolvedValueOnce({
    stdout: '',
    stderr: '',
  });

  // Is the handler wired up right?
  await ipcRenderer.invoke(channel, 'sdb1');

  expect(execMock).not.toHaveBeenCalled();
});
