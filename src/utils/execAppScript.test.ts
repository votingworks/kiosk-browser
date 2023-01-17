import exec from './exec';
import execAppScript from './execAppScript';
import mockOf from '../../test/mockOf';

const execMock = mockOf(exec);
jest.mock('./exec');

test('execAppScript with sudo', async () => {
  execMock.mockResolvedValueOnce({
    stdout: '',
    stderr: '',
  });

  await execAppScript(
    'script.sh',
    { appScriptsDirectory: '/tmp', sudo: true },
    ['arg'],
    'stdin',
  );
  expect(execMock).toHaveBeenCalledTimes(1);
  expect(execMock).toHaveBeenCalledWith(
    'sudo',
    ['-n', '/tmp/script.sh', 'arg'],
    'stdin',
  );
});

test('execAppScript without sudo', async () => {
  execMock.mockResolvedValueOnce({
    stdout: '',
    stderr: '',
  });

  await execAppScript(
    'script.sh',
    { appScriptsDirectory: '/tmp' },
    ['arg'],
    'stdin',
  );
  expect(execMock).toHaveBeenCalledTimes(1);
  expect(execMock).toHaveBeenCalledWith('/tmp/script.sh', ['arg'], 'stdin');
});

test('no appScriptsDirectoryProvided', async () => {
  await execAppScript('script.sh', {}, []);
  expect(execMock).not.toHaveBeenCalled();
});
