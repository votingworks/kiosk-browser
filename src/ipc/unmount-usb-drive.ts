import { IpcMain } from 'electron';
import { Options } from '../utils/options';
import execAppScript from '../utils/execAppScript';

export const channel = 'unmountUsbDrive';

async function unmountUsbDrive(appScriptsDirectory?: string): Promise<void> {
  await execAppScript(
    'unmount-usb.sh',
    { appScriptsDirectory, sudo: true },
    [],
  );
}

export default function register(
  ipcMain: IpcMain,
  { options: kioskBrowserOptions }: { options: Options },
): void {
  ipcMain.handle(channel, async () => {
    await unmountUsbDrive(kioskBrowserOptions.appScriptsDirectory);
  });
}
