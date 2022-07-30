import { IpcMain, IpcMainInvokeEvent } from 'electron';
import exec from '../utils/exec';

export const channel = 'syncUsbDrive';

async function syncUsbDrive(mountPoint: string): Promise<void> {
  await exec('sync', ['-f', mountPoint]);
}

export default function register(ipcMain: IpcMain): void {
  ipcMain.handle(
    channel,
    async (event: IpcMainInvokeEvent, mountPoint: string) => {
      await syncUsbDrive(mountPoint);
    },
  );
}
