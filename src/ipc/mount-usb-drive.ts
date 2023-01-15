import { IpcMain, IpcMainInvokeEvent } from 'electron';
import { join } from 'path';
import { Options } from '../utils/options';
import execAppScript from '../utils/execAppScript';

export const channel = 'mountUsbDrive';

async function mountUsbDrive(
  device: string,
  appScriptsDirectory?: string,
): Promise<void> {
  await execAppScript('mount.sh', { appScriptsDirectory, sudo: true }, [
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
