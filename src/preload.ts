import makeDebug from 'debug';
import { contextBridge, ipcRenderer } from 'electron';
import { channel as showOpenDialogChannel } from './ipc/show-open-dialog';
import { channel as logChannel } from './ipc/log';
import { channel as quitChannel } from './ipc/quit';
import { channel as captureScreenshotChannel } from './ipc/capture-screenshot';

const debug = makeDebug('kiosk-browser:client');
type Kiosk = KioskBrowser.Kiosk;

function makeKiosk(): Kiosk {
  return {
    async showOpenDialog(options) {
      debug('forwarding `showOpenDialog` to main process');
      return (await ipcRenderer.invoke(
        showOpenDialogChannel,
        options,
      )) as ReturnType<Kiosk['showOpenDialog']>;
    },

    async log(message) {
      debug('forwarding `log` to the main process');
      await ipcRenderer.invoke(logChannel, message);
    },

    quit() {
      debug('forwarding `quit` to main process');
      void ipcRenderer.invoke(quitChannel);
    },

    async captureScreenshot() {
      debug('forwarding `captureScreenshot` to the main process');
      return (await ipcRenderer.invoke(captureScreenshotChannel)) as ReturnType<
        Kiosk['captureScreenshot']
      >;
    },
  };
}

debug('setting up window.kiosk');
contextBridge.exposeInMainWorld('kiosk', makeKiosk());
