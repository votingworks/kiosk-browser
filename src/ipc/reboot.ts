import { IpcMain } from 'electron';
import exec from '../utils/exec';

export const channel = 'reboot';

/**
 * Reboot the machine
 */
export default function register(ipcMain: IpcMain): void {
  ipcMain.handle(channel, () => {
    void exec('reboot');
  });
}
