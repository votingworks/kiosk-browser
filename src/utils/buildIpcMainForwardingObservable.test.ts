import { fakeIpc } from '../../test/ipc';
import buildIpcMainForwardingObservable from './buildIpcMainForwardingObservable';

test('subscribes on first connection', () => {
  const { ipcMain, ipcRenderer } = fakeIpc();
  const handler = jest.fn();

  ipcMain.handle('test-channel', handler);
  const observable = buildIpcMainForwardingObservable(
    ipcRenderer,
    'test-channel',
  );
  expect(handler).not.toHaveBeenCalled();

  observable.subscribe(jest.fn());
  expect(handler).toHaveBeenCalledWith(expect.anything(), { subscribe: true });
});

test('unsubscribes on last disconnection', () => {
  const { ipcMain, ipcRenderer } = fakeIpc();
  const handler = jest.fn();

  ipcMain.handle('test-channel', handler);
  const observable = buildIpcMainForwardingObservable(
    ipcRenderer,
    'test-channel',
  );
  expect(handler).not.toHaveBeenCalled();

  const unsubscribe = observable.subscribe(jest.fn());
  unsubscribe();

  expect(handler).toHaveBeenNthCalledWith(1, expect.anything(), {
    subscribe: true,
  });
  expect(handler).toHaveBeenNthCalledWith(2, expect.anything(), {
    subscribe: false,
  });
});
