import { fakeIpc } from '../../test/ipc';
import register, { channel as storageRemoveChannel } from './storage-remove';
import storage from 'electron-json-storage';
import { promisify } from 'util';

const set = promisify(storage.set);
const has = promisify(storage.has);

test('storage-remove works', async () => {
  const { ipcMain, ipcRenderer } = fakeIpc();

  register(ipcMain);

  await set('foo', { a: 1 });
  expect(await has('foo')).toBe(true);
  await ipcRenderer.invoke(storageRemoveChannel, 'foo');

  expect(await has('foo')).toBe(false);
  expect(storage.remove).toHaveBeenCalledWith('foo', expect.any(Function));
});
