import * as electron from 'electron';
import register, { channel } from './show-open-dialog';
import { fakeIpc } from '../../test/ipc';
import mockOf from '../../test/mockOf';

jest.mock('electron', () => ({
  dialog: {
    showOpenDialog: jest.fn(),
  },
}));

test('show-open-dialog', async () => {
  mockOf(electron.dialog.showOpenDialog).mockResolvedValueOnce({
    canceled: false,
    filePaths: ['/example/path.txt'],
  });
  const { ipcMain, ipcRenderer } = fakeIpc();

  register(ipcMain);

  await ipcRenderer.invoke(channel, { defaultPath: '/home/user' });
  expect(electron.dialog.showOpenDialog).toHaveBeenCalledWith({
    defaultPath: '/home/user',
  });
});
