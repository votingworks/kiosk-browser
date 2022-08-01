import makeDebug from 'debug';
import { IpcMain } from 'electron';
import exec from '../utils/exec';

export const channel = 'cancelSpeak';

const debug = makeDebug('kiosk-browser:speak');

/**
 * Sends request to speech-dispatcher to cancel all messages
 * @returns promise representing call to `spd-say -C`
 */
async function cancelSpeak(): Promise<void> {
  debug('cancelling all messages in speech dispatcher...');
  try {
    await exec('spd-say', ['-C']);
    debug('cancelled all messages in speech dispatcher');
  } catch (e) {
    debug('failed to cancel messages in speech dispatcher with error %s', e);
  }
}

export default function register(ipcMain: IpcMain): void {
  /**
   * If `cancelSpeak` is called several times in a row, the `spd-say` process
   * will fail because the speech-dispatcher is already running. So in this
   * method, we track the current request to cancel with `promiseToCancel` and
   * only initiate a new request if necessary.
   */
  let promiseToCancel: Promise<void> | undefined = undefined;
  ipcMain.handle(channel, async () => {
    if (promiseToCancel) {
      await promiseToCancel;
    } else {
      promiseToCancel = cancelSpeak();
      await promiseToCancel;
      promiseToCancel = undefined;
    }
  });
}
