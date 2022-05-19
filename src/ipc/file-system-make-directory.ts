import makeDebug from 'debug';
import { IpcMain, IpcMainInvokeEvent } from 'electron';
import { isAbsolute } from 'path';
import { assertHasWriteAccess, OriginFilePermission } from '../utils/access';
import { Options } from '../utils/options';
import { MakeDirectoryOptions, promises as fs } from 'fs';

const debug = makeDebug('kiosk-browser:file-system-make-directory');

export const channel = 'file-system-make-directory';

export async function makeDirectory(
  permissions: readonly OriginFilePermission[],
  origin: string,
  path: string,
  options: MakeDirectoryOptions = {},
): Promise<void> {
  if (!isAbsolute(path)) {
    debug('aborting request because it is not an absolute path');
    throw new Error(`requested path is not absolute: ${path}`);
  }

  assertHasWriteAccess(permissions, origin, path);
  debug('%s requested to create %s', origin, path);
  await fs.mkdir(path, options);
}

export default function register(
  ipcMain: IpcMain,
  { options }: { options: Options },
): void {
  ipcMain.handle(
    channel,
    async (
      event: IpcMainInvokeEvent,
      path: string,
      opts: MakeDirectoryOptions,
    ) => {
      const url = new URL(event.sender.getURL());
      return await makeDirectory(
        options.originFilePermissions,
        url.origin,
        path,
        opts,
      );
    },
  );
}
