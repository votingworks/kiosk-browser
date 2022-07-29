import { fakeIpc } from '../../test/ipc';
import register, { channel } from './reboot';
import mockOf from '../../test/mockOf';
import execSync from '../utils/execSync';

const execSyncMock = mockOf(execSync);
jest.mock('../utils/execSync');

beforeEach(() => {
  execSyncMock.mockReset();
  execSyncMock.mockReturnValue({ stdout: '', stderr: '' });
});

test('reboot', async () => {
  const { ipcMain, ipcRenderer } = fakeIpc();

  register(ipcMain);

  await ipcRenderer.invoke(channel);
  expect(execSyncMock).toHaveBeenCalledTimes(1);
});
