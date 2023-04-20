import register, { channel } from './capture-screenshot';
import { fakeIpc } from '../../test/ipc';
import { NativeImage } from 'electron';

test('capture-screenshot', async () => {
  const mockNativeImage: Partial<NativeImage> = {
    toPNG: jest.fn().mockReturnValue('png'),
  };
  const capturePage = jest.fn().mockResolvedValue(mockNativeImage);
  const { ipcMain, ipcRenderer } = fakeIpc({ capturePage });

  register(ipcMain);

  expect(await ipcRenderer.invoke(channel)).toEqual('png');
  expect(capturePage).toHaveBeenCalledTimes(1);
});
