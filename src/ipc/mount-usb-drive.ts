import { IpcMain, IpcMainInvokeEvent } from 'electron';
import { join } from 'path';
import exec from '../utils/exec';

export const channel = 'mountUsbDrive';

export interface Options {
  device: string;
  label?: string;
}

async function mountUsbDrive(options: Options): Promise<void> {
  await exec('pmount', [
    '-w',
    '-u',
    '000',
    join('/dev', options.device),
    options.label ?? `usb-drive-${options.device}`,
  ]);
}

export default function register(ipcMain: IpcMain): void {
  ipcMain.handle(
    channel,
    async (event: IpcMainInvokeEvent, options: Options) => {
      await mountUsbDrive(options);
    },
  );
}
