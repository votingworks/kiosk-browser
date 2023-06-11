import {
  IpcMain,
  IpcMainInvokeEvent,
  dialog,
  SaveDialogOptions,
} from 'electron';

export const channel = 'show-save-dialog';

export default function register(ipcMain: IpcMain): void {
  ipcMain.handle(
    channel,
    async (event: IpcMainInvokeEvent, options: SaveDialogOptions) => {
      return dialog.showSaveDialog(options);
    },
  );
}
