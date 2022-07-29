import child_process, { spawn } from 'child_process';
import exec from './exec';

jest.spyOn(child_process, 'spawn');

test('command with no args', async () => {
  const execPromise = exec('echo');
  expect(spawn).toHaveBeenCalledWith('echo', []);
  await expect(execPromise).resolves.toEqual(undefined);
});

test('command with args', async () => {
  const execPromise = exec('echo', ['hi']);
  expect(spawn).toHaveBeenCalledWith('echo', ['hi']);
  await expect(execPromise).resolves.toEqual(undefined);
});

test('command that does not exist', async () => {
  const execPromise = exec('not-a-command');
  await expect(execPromise).rejects.toThrow('spawn not-a-command ENOENT');
});

test('command which exits with 1', async () => {
  const execPromise = exec('false');
  await expect(execPromise).rejects.toThrow(
    'Error: Command failed: false  (stdout= stderr=)',
  );
});
