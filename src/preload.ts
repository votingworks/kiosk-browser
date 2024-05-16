import makeDebug from 'debug';
import {
  contextBridge,
  ipcRenderer,
  OpenDialogOptions,
  OpenDialogReturnValue,
  SaveDialogOptions,
  SaveDialogReturnValue,
} from 'electron';
import { channel as showOpenDialogChannel } from './ipc/show-open-dialog';
import { channel as showSaveDialogChannel } from './ipc/show-save-dialog';
import { channel as logChannel } from './ipc/log';
import { channel as quitChannel } from './ipc/quit';
import { PromptToSaveOptions } from './ipc/saveAs';
import { channel as captureScreenshotChannel } from './ipc/capture-screenshot';

import { FileWriter, fromPrompt } from './utils/FileWriter';

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

    async showSaveDialog(
      options?: SaveDialogOptions,
    ): Promise<SaveDialogReturnValue> {
      debug('forwarding `showSaveDialog` to main process');
      return (await ipcRenderer.invoke(
        showSaveDialogChannel,
        options,
      )) as SaveDialogReturnValue;
    },

    async log(message: string): Promise<void> {
      debug('forwarding `log` to the main process');
      await ipcRenderer.invoke(logChannel, message);
    },

    async saveAs(
      options?: PromptToSaveOptions,
    ): Promise<FileWriter | undefined> {
      return await fromPrompt(options);
    },

    quit(exitCode?: number): void {
      debug('forwarding `quit` to main process');
      if (typeof exitCode === 'undefined') {
        void ipcRenderer.invoke(quitChannel);
      } else {
        void ipcRenderer.invoke(quitChannel, exitCode);
      }
    },

    async captureScreenshot(): Promise<Buffer> {
      debug('forwarding `captureScreenshot` to the main process');
      return (await ipcRenderer.invoke(captureScreenshotChannel)) as Buffer;
    },
  };
}

debug('setting up window.kiosk');
contextBridge.exposeInMainWorld('kiosk', makeKiosk());
