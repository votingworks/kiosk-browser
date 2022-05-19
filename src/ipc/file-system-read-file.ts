import makeDebug from 'debug';
import { IpcMain, IpcMainInvokeEvent } from 'electron';
import { promises as fs } from 'fs';
import { isAbsolute } from 'path';
import { assertHasReadAccess, OriginFilePermission } from '../utils/access';
import { Options } from '../utils/options';

const debug = makeDebug('kiosk-browser:file-system-read-file');

export const channel = 'file-system-read-file';

export async function readFile(
  origin: string,
  permissions: readonly OriginFilePermission[],
  path: string,
  encoding?: BufferEncoding,
): Promise<Buffer | string> {
  if (!isAbsolute(path)) {
    debug('aborting request because it is not an absolute path');
    throw new Error(`requested path is not absolute: ${path}`);
  }

  assertHasReadAccess(permissions, origin, path);
  return await fs.readFile(path, { encoding });
}

export default function register(
  ipcMain: IpcMain,
  { options }: { options: Options },
): void {
  ipcMain.handle(
    channel,
    (event: IpcMainInvokeEvent, path: string, encoding?: BufferEncoding) => {
      const url = new URL(event.sender.getURL());
      return readFile(
        url.origin,
        options.originFilePermissions,
        path,
        encoding,
      );
    },
  );
}
