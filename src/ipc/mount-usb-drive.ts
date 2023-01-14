import { IpcMain, IpcMainInvokeEvent } from 'electron';
import { join } from 'path';
import { Options } from '../utils/options';
import execScript from '../utils/execScript';

export const channel = 'mountUsbDrive';

async function mountUsbDrive(
  device: string,
  appScriptsDirectory?: string,
): Promise<void> {
  await execScript('mount.sh', { appScriptsDirectory, sudo: true }, [
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
