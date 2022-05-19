import { IpcMain, app } from 'electron';
import makeDebug from 'debug';

const debug = makeDebug('kiosk-browser:quit');

export const channel = 'quit';

/**
 * Quit the application.
 */
export default function register(ipcMain: IpcMain): void {
  ipcMain.handle(channel, () => {
    debug('hosted web content sent request to quit, quitting');
    app.quit();
  });
}
