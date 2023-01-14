import { IpcMain } from 'electron';
import makeDebug from 'debug';
import { Options } from '../utils/options';
import exec from '../utils/exec';
import path from 'path';

const debug = makeDebug('kiosk-browser:unmount-usb-drive');

export const channel = 'unmountUsbDrive';

async function unmountUsbDrive(appScriptsDirectory?: string): Promise<void> {
  if (!appScriptsDirectory) {
    debug(
      'could not unmount USB drive because no app scripts directory was passed to kiosk-browser',
    );
    return;
  }

  await exec('sudo', ['-n', path.join(appScriptsDirectory, 'umount.sh')]);
}

export default function register(
  ipcMain: IpcMain,
  { options: kioskBrowserOptions }: { options: Options },
): void {
  ipcMain.handle(channel, async () => {
    await unmountUsbDrive(kioskBrowserOptions.appScriptsDirectory);
  });
}
