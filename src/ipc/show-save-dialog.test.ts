import * as electron from 'electron';
import register, { channel } from './show-save-dialog';
import { fakeIpc } from '../../test/ipc';
import mockOf from '../../test/mockOf';

jest.mock('electron', () => ({
  dialog: {
    showSaveDialog: jest.fn(),
  },
}));

test('show-save-dialog', async () => {
  mockOf(electron.dialog.showSaveDialog).mockResolvedValueOnce({
    canceled: false,
    filePath: '/example/path.txt',
  });
  const { ipcMain, ipcRenderer } = fakeIpc();

  register(ipcMain);

  await ipcRenderer.invoke(channel, { defaultPath: '/home/user' });
  expect(electron.dialog.showSaveDialog).toHaveBeenCalledWith({
    defaultPath: '/home/user',
  });
});
