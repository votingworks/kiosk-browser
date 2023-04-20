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
  const mockReturnValue: electron.OpenDialogReturnValue = {
    canceled: false,
    filePaths: ['/example/path.txt'],
  };
  mockOf(electron.dialog.showOpenDialog).mockResolvedValueOnce(mockReturnValue);
  const { ipcMain, ipcRenderer } = fakeIpc();

  register(ipcMain);

  expect(
    await ipcRenderer.invoke(channel, { defaultPath: '/home/user' }),
  ).toEqual(mockReturnValue);
  expect(electron.dialog.showOpenDialog).toHaveBeenCalledWith({
    defaultPath: '/home/user',
  });
});
