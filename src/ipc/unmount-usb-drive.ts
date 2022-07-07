import { IpcMain, IpcMainInvokeEvent } from 'electron';
import { join } from 'path';
import exec from '../utils/exec';

export const channel = 'unmountUsbDrive';

function unmountUsbDrive(device: string): void {
  exec('pumount', [join('/dev', device)]);
}

export default function register(ipcMain: IpcMain): void {
  ipcMain.handle(channel, (event: IpcMainInvokeEvent, device: string) => {
    unmountUsbDrive(device);
  });
}
