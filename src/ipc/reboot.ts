import { IpcMain } from 'electron';
import execSync from '../utils/execSync';

export const channel = 'reboot';

/**
 * Reboot the machine
 */
export default function register(ipcMain: IpcMain): void {
  ipcMain.handle(channel, () => {
    execSync('reboot');
  });
}
