import makeDebug from 'debug';
import { IpcMain, IpcMainInvokeEvent } from 'electron';
import { RegisterIpcHandler } from '..';
import execSync from '../utils/execSync';

export const channel = 'sign';

const debug = makeDebug('kiosk-browser:sign');

export interface SignParams {
  signatureType: string;
  payload: string;
}

function sign(
  { signatureType, payload }: SignParams,
  signingScriptPath?: string,
): string | undefined {
  if (!signingScriptPath) {
    debug('could not sign because no signing script specified!');
    return;
  }

  if (signatureType.includes('.')) {
    debug('signature type cannot contain a period, which is our delimiter');
    return;
  }

  const rawPayloadToSign = `${signatureType}.${payload}`;

  try {
    const { stdout, stderr } = execSync(
      // TODO this feels really dangerous, is there a better way?
      signingScriptPath,
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
  ipcMain.handle(channel, (event: IpcMainInvokeEvent, params: SignParams) =>
    sign(params, options.signingScriptPath),
  );
};

export default register;
