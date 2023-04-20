import register, { channel } from './capture-screenshot';
import { fakeIpc } from '../../test/ipc';
import { NativeImage } from 'electron';

test('capture-screenshot', async () => {
  const mockNativeImage: Partial<NativeImage> = { toPNG: jest.fn() };
  const capturePage = jest.fn().mockResolvedValue(mockNativeImage);
  const { ipcMain, ipcRenderer } = fakeIpc({ capturePage });

  register(ipcMain);

  await ipcRenderer.invoke(channel);
  expect(capturePage).toHaveBeenCalledTimes(1);
});
