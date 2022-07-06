import { IpcMain, IpcMainInvokeEvent } from 'electron';
import { DateTime } from 'luxon';
import exec from '../utils/exec';

export const channel = 'setClock';

function clockSet({
  isoDatetime,
  IANAZone,
}: KioskBrowser.SetClockParams): void {
  const datetimeString = DateTime.fromISO(isoDatetime, {
    zone: IANAZone,
  }).toFormat('yyyy-LL-dd TT');
  exec('sudo', ['-n', 'timedatectl', 'set-timezone', IANAZone]);
  exec('sudo', ['-n', 'timedatectl', 'set-time', datetimeString]);
}

export default function register(ipcMain: IpcMain): void {
  ipcMain.handle(
    channel,
    (event: IpcMainInvokeEvent, params: KioskBrowser.SetClockParams) => {
      try {
        clockSet(params);
      } catch (err) {
        const error = err as Error;
        if ('stderr' in error) {
          throw new Error((error as unknown as { stderr: string }).stderr);
        } else {
          throw error;
        }
      }
    },
  );
}
