import storage from 'electron-json-storage';
import { promisify } from 'util';
import { fakeIpc } from '../../test/ipc';
import register, { channel as storageGetChannel } from './storage-get';

const set = promisify(storage.set);

test('storage-get works', async () => {
  const { ipcMain, ipcRenderer } = fakeIpc();

  register(ipcMain);

  await set('foo', { fizz: 'buzz' });
  expect(await ipcRenderer.invoke(storageGetChannel, 'foo')).toEqual({
    fizz: 'buzz',
  });

  expect(storage.get).toHaveBeenCalledWith('foo', expect.any(Function));
});
