import { fakeIpc } from '../../test/ipc';
import register, { channel as storageClearChannel } from './storage-clear';
import storage from 'electron-json-storage';
import { promisify } from 'util';

const get = promisify(storage.get);
const set = promisify(storage.set);

test('store works', async () => {
  const { ipcMain, ipcRenderer } = fakeIpc();

  register(ipcMain);

  await set('a', { a: 1 });
  await set('b', { b: 2 });
  await ipcRenderer.invoke(storageClearChannel);

  expect(storage.clear).toHaveBeenCalledWith(expect.any(Function));
  expect(await get('a')).toEqual(undefined);
  expect(await get('b')).toEqual(undefined);
});
