import { spawnSync, SpawnSyncReturns } from 'child_process';
import exec from './exec';
import mockOf from '../../test/mockOf';
import { EventEmitter } from 'events';
import MemoryStream from 'memorystream';

jest.mock('child_process');

function mockSpawnSync(results: Partial<SpawnSyncReturns<string>> = {}): void {
  const stdout = results.stdout || '';
  const stderr = results.stderr || '';
  mockOf(spawnSync).mockReturnValueOnce({
    pid: 1,
    status: 0,
    signal: 'SIGTERM',
    stdout,
    stderr,
    output: [stdout, stderr],
    ...results,
  });
}

test('command with no args', async () => {
  mockSpawnSync();
  const execPromise = exec('ls');
  expect(await execPromise).toEqual({ stdout: '', stderr: '' });
  expect(spawnSync).toHaveBeenCalledWith('ls', [], { input: undefined });
});

test('command with args', async () => {
  mockSpawnSync();
  const execPromise = exec('ls', ['-la']);
  expect(await execPromise).toEqual({ stdout: '', stderr: '' });
  expect(spawnSync).toHaveBeenCalledWith('ls', ['-la'], { input: undefined });
});

test('command printing stdout', async () => {
  mockSpawnSync({ stdout: 'README.md\n' });
  const execPromise = exec('ls', ['-la']);
  expect(await execPromise).toEqual({ stdout: 'README.md\n', stderr: '' });
  expect(spawnSync).toHaveBeenCalledWith('ls', ['-la'], { input: undefined });
});

test('failed command printing stderr', async () => {
  mockSpawnSync({ status: 1, stderr: 'unknown option "-x"' });
  const execPromise = exec('ls', ['-x']);
  await expect(execPromise).rejects.toThrowError(
    expect.objectContaining({
      stderr: 'unknown option "-x"',
      code: 1,
    }) as Error,
  );
  expect(spawnSync).toHaveBeenCalledWith('ls', ['-x'], { input: undefined });
});

test('command with stdin', async () => {
  mockSpawnSync();
  const execPromise = exec('lpr', ['-P', 'VxPrinter'], 'foobarbaz to print');
  await execPromise;
  expect(spawnSync).toHaveBeenCalledWith('lpr', ['-P', 'VxPrinter'], {
    input: 'foobarbaz to print',
  });
});

test('unknown command', async () => {
  mockSpawnSync({ error: new Error('Error: spawnSync not-a-command ENOENT') });
  const execPromise = exec('not-a-command');
  await expect(execPromise).rejects.toThrowError(
    'Error: spawnSync not-a-command ENOENT',
  );
});
