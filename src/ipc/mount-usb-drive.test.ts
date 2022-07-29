import { fakeIpc } from '../../test/ipc';
import mockOf from '../../test/mockOf';
import execSync from '../utils/execSync';
import register, { channel } from './mount-usb-drive';

const execSyncMock = mockOf(execSync);

jest.mock('../utils/execSync');

test('mount-usb-drive', async () => {
  // Register our handler.
  const { ipcMain, ipcRenderer } = fakeIpc();
  register(ipcMain);

  // Things should be registered as expected.
  execSyncMock.mockReturnValueOnce({
    stdout: '',
    stderr: '',
  });

  // Is the handler wired up right?
  await ipcRenderer.invoke(channel, { device: 'sdb1' });

  expect(execSyncMock).toHaveBeenCalledWith('pmount', [
    '-w',
    '-u',
    '000',
    '/dev/sdb1',
    'usb-drive-sdb1',
  ]);
});

test('mount-usb-drive with custom label', async () => {
  // Register our handler.
  const { ipcMain, ipcRenderer } = fakeIpc();
  register(ipcMain);

  // Things should be registered as expected.
  execSyncMock.mockReturnValueOnce({
    stdout: '',
    stderr: '',
  });

  // Is the handler wired up right?
  await ipcRenderer.invoke(channel, { device: 'sdb1', label: 'usb-drive' });

  expect(execSyncMock).toHaveBeenCalledWith('pmount', [
    '-w',
    '-u',
    '000',
    '/dev/sdb1',
    'usb-drive',
  ]);
});
