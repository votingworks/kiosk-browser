import { IpcMain, IpcMainInvokeEvent } from 'electron';
import path, { join } from 'path';
import makeDebug from 'debug';
import { Options } from '../utils/options';
import exec from '../utils/exec';

const debug = makeDebug('kiosk-browser:mount-usb-drive');

export const channel = 'mountUsbDrive';

async function mountUsbDrive(
  device: string,
  appScriptsDirectory?: string,
): Promise<void> {
  if (!appScriptsDirectory) {
    debug(
      'could not mount USB drive because no app scripts directory was passed to kiosk-browser',
    );
    return;
  }

  await exec('sudo', [
    '-n',
    path.join(appScriptsDirectory, 'mount.sh'),
    join('/dev', device),
  ]);
}

export default function register(
  ipcMain: IpcMain,
  { options: kioskBrowserOptions }: { options: Options },
): void {
  ipcMain.handle(channel, async (event: IpcMainInvokeEvent, device: string) => {
    await mountUsbDrive(device, kioskBrowserOptions.appScriptsDirectory);
  });
}
