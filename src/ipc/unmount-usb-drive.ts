import { IpcMain, IpcMainInvokeEvent } from 'electron';
import { join } from 'path';
import execSync from '../utils/execSync';

export const channel = 'unmountUsbDrive';

function unmountUsbDrive(device: string): void {
  execSync('pumount', [join('/dev', device)]);
}

export default function register(ipcMain: IpcMain): void {
  ipcMain.handle(channel, (event: IpcMainInvokeEvent, device: string) => {
    unmountUsbDrive(device);
  });
}
