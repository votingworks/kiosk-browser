import { spawnSync } from 'child_process';
import { ExecResult, makeExecError } from './execTypes';
import makeDebug from 'debug';

const debug = makeDebug('kiosk-browser:exec:sync');

/**
 * The native `child_process.execSync` function does not do input sanitization
 * so is vulnerable to injection attacks. This implementation uses
 * `child_process.spawnSync` under the hood, which does sanitize input.
 */
export default function execSync(
  file: string,
  args: readonly string[] = [],
  input?: string | Buffer,
): ExecResult {
  debug('running command=%s args=%o stdin=%s', file, args, typeof input);
  const {
    stdout: stdoutBuffer,
    stderr: stderrBuffer,
    status,
    signal,
    error,
    pid,
  } = spawnSync(file, args, {
    input,
  });
  debug(
    'process %d exited with code=%d, signal=%s (command=%s args=%o)',
    pid,
    status,
    signal,
    file,
    args,
  );
  const stdout = stdoutBuffer.toString();
  const stderr = stderrBuffer.toString();
  if (error) {
    throw error;
  } else if (status !== 0) {
    throw makeExecError({
      code: status ?? undefined,
      signal,
      stdout,
      stderr,
      cmd: `${file} ${args.join(' ')}`,
    });
  }
  return { stdout, stderr };
}
