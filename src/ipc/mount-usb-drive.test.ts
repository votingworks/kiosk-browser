import { mockHandlerContext } from '../../test/mockHandlerContext';
import { fakeIpc } from '../../test/ipc';
import mockOf from '../../test/mockOf';
import execAppScript from '../utils/execAppScript';
import register, { channel } from './mount-usb-drive';

const execAppScriptMock = mockOf(execAppScript);

jest.mock('../utils/execAppScript');

test('mount-usb-drive', async () => {
  const { ipcMain, ipcRenderer } = fakeIpc();
  register(ipcMain, mockHandlerContext());

  // Things should be registered as expected.
  execAppScriptMock.mockResolvedValueOnce({
    stdout: '',
    stderr: '',
  });

  await ipcRenderer.invoke(channel, 'sdb1');
  expect(execAppScriptMock).toHaveBeenCalledWith(
    'mount.sh',
    {
      appScriptsDirectory: '/tmp',
      sudo: true,
    },
    ['/dev/sdb1'],
  );
});
