import { IpcMain, IpcMainInvokeEvent } from 'electron';
import { join } from 'path';
import exec from '../utils/exec';

export const channel = 'mountUsbDrive';

export interface Options {
  device: string;
  label?: string;
}

const MOUNT_DIRECTORY = '/media/vx/usb-drive';
const MOUNT_OPTIONS = ['umask=000', 'nosuid', 'nodev', 'noexec'];

async function mountUsbDrive(options: Options): Promise<void> {
  await exec('sudo', [
    '-n',
    'mount',
    '-w',
    '-o',
    MOUNT_OPTIONS.join(','),
    join('/dev', options.device),
    MOUNT_DIRECTORY,
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
