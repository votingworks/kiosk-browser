import exec from './exec';
import makeDebug from 'debug';
import path from 'path';

const debug = makeDebug('kiosk-browser:exec');

export interface execAppScriptOptions {
  appScriptsDirectory?: string;
  sudo?: boolean;
}

/**
 * Thin wrapper around `exec` for executing scripts expected in the app scripts
 * directory.
 */
export default async function execAppScript(
  script: string,
  options: execAppScriptOptions,
  args: readonly string[] = [],
  stdin?: string | Buffer,
): Promise<{ stdout: string; stderr: string }> {
  if (!options.appScriptsDirectory) {
    debug(
      `Could not execute ${script} because no app scripts directory was passed to kiosk-browser on startup`,
    );
    return Promise.resolve({ stdout: '', stderr: '' });
  }

  const scriptPath = path.join(options.appScriptsDirectory, script);

  if (options.sudo) {
    return exec('sudo', ['-n', scriptPath, ...args], stdin);
  } else {
    return exec(scriptPath, args, stdin);
  }
}
