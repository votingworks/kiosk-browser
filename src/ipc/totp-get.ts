import makeDebug from 'debug';
import { IpcMain } from 'electron';
import exec from '../utils/exec';

export const channel = 'totpGet';

const debug = makeDebug('kiosk-browser:totp');

export interface TotpInfo {
  isoDatetime: string;
  code: string;
}

async function totpGet(): Promise<TotpInfo | undefined> {
  try {
    const { stdout, stderr } = await exec('sudo', [
      '-n',
      '/usr/local/bin/tpm2-totp',
      '-t',
      'show',
    ]);

    if (stderr) return undefined;

    const [timestamp, code] = stdout.split(': ');

    return {
      isoDatetime: new Date(timestamp).toISOString(),
      code,
    };
  } catch (err) {
    debug('could not call tpm2-totp: %s', err);
    return undefined;
  }
}

export default function register(ipcMain: IpcMain): void {
  ipcMain.handle(channel, async () => totpGet());
}
