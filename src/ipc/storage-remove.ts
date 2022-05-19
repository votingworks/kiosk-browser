import { IpcMain, IpcMainInvokeEvent } from 'electron';
import storage from 'electron-json-storage';
import { promisify } from 'util';

const remove = promisify(storage.remove);

export const channel = 'storageRemove';

async function storageRemove(key: string): Promise<void> {
  await remove(key);
}

export default function register(ipcMain: IpcMain): void {
  ipcMain.handle(channel, async (event: IpcMainInvokeEvent, key: string) =>
    storageRemove(key),
  );
}
