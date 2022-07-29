import { IpcMain, IpcMainInvokeEvent } from 'electron';
import { join } from 'path';
import execSync from '../utils/execSync';

export const channel = 'mountUsbDrive';

export interface Options {
  device: string;
  label?: string;
}

function mountUsbDrive(options: Options): void {
  execSync('pmount', [
    '-w',
    '-u',
    '000',
    join('/dev', options.device),
    options.label ?? `usb-drive-${options.device}`,
  ]);
}

export default function register(ipcMain: IpcMain): void {
  ipcMain.handle(channel, (event: IpcMainInvokeEvent, options: Options) => {
    mountUsbDrive(options);
  });
}
