import {
  IpcMain,
  IpcMainInvokeEvent,
  dialog,
  OpenDialogOptions,
} from 'electron';

export const channel = 'show-open-dialog';

export default function register(ipcMain: IpcMain): void {
  ipcMain.handle(
    channel,
    async (event: IpcMainInvokeEvent, options: OpenDialogOptions) => {
      return dialog.showOpenDialog(options);
    },
  );
}
