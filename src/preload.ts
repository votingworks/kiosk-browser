import makeDebug from 'debug';
import {
  contextBridge,
  ipcRenderer,
  OpenDialogOptions,
  OpenDialogReturnValue,
} from 'electron';
import { channel as showOpenDialogChannel } from './ipc/show-open-dialog';
import { channel as logChannel } from './ipc/log';
import { channel as quitChannel } from './ipc/quit';
import { channel as captureScreenshotChannel } from './ipc/capture-screenshot';

const debug = makeDebug('kiosk-browser:client');

function makeKiosk(): KioskBrowser.Kiosk {
  return {
    async showOpenDialog(
      options?: OpenDialogOptions,
    ): Promise<OpenDialogReturnValue> {
      debug('forwarding `showOpenDialog` to main process');
      return (await ipcRenderer.invoke(
        showOpenDialogChannel,
        options,
      )) as OpenDialogReturnValue;
    },

    async log(message: string): Promise<void> {
      debug('forwarding `log` to the main process');
      await ipcRenderer.invoke(logChannel, message);
    },

    quit(): void {
      debug('forwarding `quit` to main process');
      void ipcRenderer.invoke(quitChannel);
    },

    async captureScreenshot(): Promise<Buffer> {
      debug('forwarding `captureScreenshot` to the main process');
      return (await ipcRenderer.invoke(captureScreenshotChannel)) as Buffer;
    },
  };
}

debug('setting up window.kiosk');
contextBridge.exposeInMainWorld('kiosk', makeKiosk());
