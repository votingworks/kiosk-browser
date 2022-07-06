import { spawnSync, SpawnSyncReturns } from 'child_process';
import exec from './exec';
import mockOf from '../../test/mockOf';

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

test('command with no args', () => {
  mockSpawnSync();
  const execResults = exec('ls');
  expect(execResults).toEqual({ stdout: '', stderr: '' });
  expect(spawnSync).toHaveBeenCalledWith('ls', [], { input: undefined });
});

test('command with args', () => {
  mockSpawnSync();
  const execResults = exec('ls', ['-la']);
  expect(execResults).toEqual({ stdout: '', stderr: '' });
  expect(spawnSync).toHaveBeenCalledWith('ls', ['-la'], { input: undefined });
});

test('command printing stdout', () => {
  mockSpawnSync({ stdout: 'README.md\n' });
  const execResults = exec('ls', ['-la']);
  expect(execResults).toEqual({ stdout: 'README.md\n', stderr: '' });
  expect(spawnSync).toHaveBeenCalledWith('ls', ['-la'], { input: undefined });
});

test('failed command printing stderr', () => {
  mockSpawnSync({ status: 1, stderr: 'unknown option "-x"' });
  expect(() => exec('ls', ['-x'])).toThrowError(
    expect.objectContaining({
      stderr: 'unknown option "-x"',
      code: 1,
    }) as Error,
  );
  expect(spawnSync).toHaveBeenCalledWith('ls', ['-x'], { input: undefined });
});

test('command with stdin', () => {
  mockSpawnSync();
  exec('lpr', ['-P', 'VxPrinter'], 'foobarbaz to print');
  expect(spawnSync).toHaveBeenCalledWith('lpr', ['-P', 'VxPrinter'], {
    input: 'foobarbaz to print',
  });
});

test('unknown command', () => {
  mockSpawnSync({ error: new Error('Error: spawnSync not-a-command ENOENT') });
  expect(() => exec('not-a-command')).toThrowError(
    'Error: spawnSync not-a-command ENOENT',
  );
});
