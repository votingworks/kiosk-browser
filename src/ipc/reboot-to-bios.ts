import { IpcMain } from 'electron';
import execSync from '../utils/execSync';

export const channel = 'reboot-to-bios';

/**
 * Reboot the machine
 */
export default function register(ipcMain: IpcMain): void {
  ipcMain.handle(channel, () => {
    execSync('systemctl', ['reboot', '--firmware-setup']);
  });
}
