import makeDebug from 'debug';
import { contextBridge, ipcRenderer } from 'electron';
import { channel as showOpenDialogChannel } from './ipc/show-open-dialog';
import { channel as logChannel } from './ipc/log';
import { channel as rebootChannel } from './ipc/reboot';

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

    async reboot(): Promise<void> {
      debug('forwarding `reboot` to the main process');
      await ipcRenderer.invoke(rebootChannel);
    },
  };
}

debug('setting up window.kiosk');
contextBridge.exposeInMainWorld('kiosk', makeKiosk());
