import { IpcMain } from 'electron';
import { spawn } from 'child_process';
import makeDebug from 'debug';

const debug = makeDebug('kiosk-browser:reboot');

export const channel = 'reboot';

/**
 * Reboot the machine
 */
export default function register(ipcMain: IpcMain): void {
  ipcMain.handle(channel, () => {
    debug('hosted web content sent request to reboot, rebooting');
    spawn('reboot').on('error', (error) => {
      debug('failed to run reboot: %s', error);
    });
  });
}
