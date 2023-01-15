import { mockHandlerContext } from '../../test/mockHandlerContext';
import { fakeIpc } from '../../test/ipc';
import mockOf from '../../test/mockOf';
import execAppScript from '../utils/execAppScript';
import register, { channel } from './unmount-usb-drive';

const execAppScriptMock = mockOf(execAppScript);

jest.mock('../utils/execAppScript');

test('unmount-usb-drive', async () => {
  const { ipcMain, ipcRenderer } = fakeIpc();
  register(ipcMain, mockHandlerContext());

  execAppScriptMock.mockResolvedValueOnce({
    stdout: '',
    stderr: '',
  });

  await ipcRenderer.invoke(channel);
  expect(execAppScriptMock).toHaveBeenCalledWith(
    'umount.sh',
    { appScriptsDirectory: '/tmp', sudo: true },
    [],
  );
});
