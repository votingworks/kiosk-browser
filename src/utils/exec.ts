import { spawn } from 'child_process';
import makeDebug from 'debug';
import { makeExecError } from './execTypes';

const debug = makeDebug('kiosk-browser:exec:async');

/**
 * The native `child_process.exec` function does not do input sanitization so
 * is vulnerable to injection attacks. This implementation uses
 * `child_process.spawn` under the hood, which does sanitize input.
 *
 * This implementation does not provide stdout or stderr. It is possible but
 * difficult to test for. If you need stdout or stderr, use our `execSync`. If
 * needed, this method can be augmented to return `Promise<ExecResult>`.
 */
export default function exec(
  file: string,
  args: readonly string[] = [],
): Promise<void> {
  debug('running command=%s args=%o', file, args);
  const process = spawn(file, args);
  const pid = process.pid;
  debug('process %d spawned (command=%s args=%o)', pid, file, args);

  return new Promise((resolve, reject) => {
    process.on('error', (error) => {
      reject(error);
    });

    process.on('close', (code, signal) => {
      debug(
        'process %d exited with code=%d, signal=%s (command=%s args=%o)',
        pid,
        code,
        signal,
        file,
        args,
      );

      if (code !== 0) {
        reject(
          makeExecError({
            code: code ?? undefined,
            signal,
            cmd: `${file} ${args.join(' ')}`,
          }),
        );
      }

      resolve();
    });
  });
}
