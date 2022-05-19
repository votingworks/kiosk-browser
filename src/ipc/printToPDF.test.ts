import { WebContents } from 'electron';
import { fakeIpc } from '../../test/ipc';
import register, { channel as printToPDFChannel } from './printToPDF';

test('prints to PDF and returns the bytes', async () => {
  const sender: Partial<WebContents> = {
    printToPDF: jest.fn().mockResolvedValueOnce(Buffer.of(50, 44, 46)), // PDF
  };
  const { ipcMain, ipcRenderer } = fakeIpc(sender);

  register(ipcMain);
  expect(await ipcRenderer.invoke(printToPDFChannel)).toEqual(
    Uint8Array.of(50, 44, 46),
  );

  expect(sender.printToPDF).toHaveBeenCalledWith({
    printBackground: true,
  });
});
