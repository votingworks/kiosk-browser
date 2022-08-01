import makeDebug from 'debug';
import { IpcMain, IpcMainInvokeEvent } from 'electron';
import exec from '../utils/exec';

export const channel = 'speak';

const debug = makeDebug('kiosk-browser:speak');

export interface Options {
  volume: number;
}

async function setVolume(volume: number) {
  if (volume >= 0 && volume <= 100) {
    try {
      await exec('amixer', [
        '-q',
        '-D',
        'pulse',
        'sset',
        'Master',
        `${volume}%`,
      ]);
      debug('volume set to %d%%', volume);
    } catch (e) {
      debug('failed to set volume to %d%% with error %s', volume, e);
    }
  } else {
    throw new Error('volume setting must be between 0 and 100, inclusive.');
  }
}

/**
 * Sends text to the speech-dispatcher via `spd-say`. Returns a promise which
 * resolves when `spd-say` exits, meaning the text was fully spoken or the
 * speech-dispatcher was cleared or interrupted by another request.
 * @param text The text to be spoken
 * @param volume Number between 0-100
 * @returns promise representing call to `spd-say`
 */
async function speak(text: string, { volume }: Options): Promise<void> {
  // Set the audio volume before every utterance
  await setVolume(volume);

  debug('sending text "%s" to speech dispatcher...', text);
  try {
    // -w flag makes spd-say wait until speaking is complete
    await exec('spd-say', ['-w', text]);
    debug('request to read text "%s" resolved by speech dispatcher', text);
  } catch (e) {
    debug('failed to send message to speech dispatcher with error %s', e);
  }
}

export default function register(ipcMain: IpcMain): void {
  ipcMain.handle(
    channel,
    async (event: IpcMainInvokeEvent, text: string, options: Options) => {
      await speak(text, options);
    },
  );
}
