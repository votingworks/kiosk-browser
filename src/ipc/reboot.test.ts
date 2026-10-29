import register, { channel } from './reboot';
import { IpcMain, IpcMainEvent } from 'electron';
import { spawn } from 'child_process';
import { EventEmitter } from 'events';
import mockOf from '../../test/mockOf';

jest.mock('child_process', () => ({
  spawn: jest.fn(),
}));

test('reboot', async () => {
  const child = new EventEmitter();
  mockOf(spawn).mockReturnValue(child as ReturnType<typeof spawn>);

  const handle = jest.fn<
    ReturnType<IpcMain['handle']>,
    Parameters<IpcMain['handle']>
  >();
  register({ handle } as unknown as IpcMain);
  expect(handle).toHaveBeenCalledWith(channel, expect.any(Function));

  const [, handler] = handle.mock.calls[0];
  await handler({} as IpcMainEvent);
  expect(spawn).toHaveBeenCalledWith('reboot');

  // A missing `reboot` binary must not crash the main process.
  expect(() => child.emit('error', new Error('ENOENT'))).not.toThrow();
});
