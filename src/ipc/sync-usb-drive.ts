import { IpcMain, IpcMainInvokeEvent } from 'electron';
import promisifiedExec from '../utils/promisifiedExec';

export const channel = 'syncUsbDrive';

async function syncUsbDrive(mountPoint: string): Promise<void> {
  await promisifiedExec(`sync -f ${mountPoint}`);
}

export default function register(ipcMain: IpcMain): void {
  ipcMain.handle(
    channel,
    async (event: IpcMainInvokeEvent, mountPoint: string) => {
      await syncUsbDrive(mountPoint);
    },
  );
}
