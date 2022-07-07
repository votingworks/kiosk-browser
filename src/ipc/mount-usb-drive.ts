import { IpcMain, IpcMainInvokeEvent } from 'electron';
import { join } from 'path';
import exec from '../utils/exec';

export const channel = 'mountUsbDrive';

export interface Options {
  device: string;
  label?: string;
}

function mountUsbDrive(options: Options): void {
  exec('pmount', [
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
