import { mockHandlerContext } from '../../test/mockHandlerContext';
import { fakeIpc } from '../../test/ipc';
import mockOf from '../../test/mockOf';
import execScript from '../utils/execScript';
import register, { channel } from './mount-usb-drive';

const execScriptMock = mockOf(execScript);

jest.mock('../utils/execScript');

test('mount-usb-drive', async () => {
  const { ipcMain, ipcRenderer } = fakeIpc();
  register(ipcMain, mockHandlerContext());

  // Things should be registered as expected.
  execScriptMock.mockResolvedValueOnce({
    stdout: '',
    stderr: '',
  });

  await ipcRenderer.invoke(channel, 'sdb1');
  expect(execScriptMock).toHaveBeenCalledWith(
    'mount.sh',
    {
      appScriptsDirectory: '/tmp',
      sudo: true,
    },
    ['/dev/sdb1'],
  );
});
