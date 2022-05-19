import { IpcMainInvokeEvent, IpcMain } from 'electron';
import { debug } from '../utils/printing';

export const channel = 'printToPDF';

/**
 * Print current page to PDF document.
 */
export default function register(ipcMain: IpcMain): void {
  ipcMain.handle(
    channel,
    async (event: IpcMainInvokeEvent): Promise<Buffer> => {
      debug('printing to PDF');
      const data = await event.sender.printToPDF({
        printBackground: true,
      });
      debug('printed to PDF, size=%d', data.length);

      return data;
    },
  );
}
