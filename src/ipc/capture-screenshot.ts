import { IpcMain, IpcMainInvokeEvent } from 'electron';

export const channel = 'capture-screenshot';

export default function register(ipcMain: IpcMain): void {
  ipcMain.handle(channel, async (event: IpcMainInvokeEvent) => {
    const nativeImage = await event.sender.capturePage();
    return nativeImage.toPNG();
  });
}
