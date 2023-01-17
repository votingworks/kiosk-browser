import makeDebug from 'debug';
import { IpcMain, IpcMainInvokeEvent } from 'electron';
import execAppScript from '../utils/execAppScript';
import { RegisterIpcHandler } from '..';

export const channel = 'sign';

const debug = makeDebug('kiosk-browser:sign');

export interface SignParams {
  signatureType: string;
  payload: string;
}

async function sign(
  { signatureType, payload }: SignParams,
  appScriptsDirectory?: string,
): Promise<string | undefined> {
  if (!appScriptsDirectory) {
    debug(
      'could not sign because no app scripts directory was passed to kiosk-browser',
    );
    return;
  }

  if (signatureType.includes('.')) {
    debug('signature type cannot contain a period, which is our delimiter');
    return;
  }

  const rawPayloadToSign = `${signatureType}.${payload}`;

  try {
    const { stdout, stderr } = await execAppScript(
      'sign.sh',
      { appScriptsDirectory, sudo: true },
      [],
      rawPayloadToSign,
    );

    if (stderr) {
      debug('error trying to sign %s', stderr);
      return;
    }

    // the first line is a comment, the second is the signature
    return stdout.split('\n')[1];
  } catch (err) {
    debug('could not call signing script: %s', err);
    return;
  }
}

const register: RegisterIpcHandler = (ipcMain: IpcMain, { options }): void => {
  ipcMain.handle(
    channel,
    async (event: IpcMainInvokeEvent, params: SignParams) => {
      return await sign(params, options.appScriptsDirectory);
    },
  );
};

export default register;
