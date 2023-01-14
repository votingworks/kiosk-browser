import { mockHandlerContext } from '../../test/mockHandlerContext';
import { fakeIpc } from '../../test/ipc';
import mockOf from '../../test/mockOf';
import execScript from '../utils/execScript';
import register, { channel } from './unmount-usb-drive';

const execScriptMock = mockOf(execScript);

jest.mock('../utils/execScript');

test('unmount-usb-drive', async () => {
  const { ipcMain, ipcRenderer } = fakeIpc();
  register(ipcMain, mockHandlerContext());

  execScriptMock.mockResolvedValueOnce({
    stdout: '',
    stderr: '',
  });

  await ipcRenderer.invoke(channel);
  expect(execScriptMock).toHaveBeenCalledWith(
    'umount.sh',
    { appScriptsDirectory: '/tmp', sudo: true },
    [],
  );
});
