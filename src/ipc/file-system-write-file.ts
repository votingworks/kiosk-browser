import makeDebug from 'debug';
import * as electron from 'electron';
import { IpcMain, IpcMainInvokeEvent } from 'electron';
import { isAbsolute } from 'path';
import { assertHasWriteAccess, OriginFilePermission } from '../utils/access';
import OpenFiles from '../utils/OpenFiles';
import { Options } from '../utils/options';

const debug = makeDebug('kiosk-browser:file-system-write-file');

export const channel = 'file-system-write-file';

export interface Open {
  type: 'Open';
  path: string;
}

export interface Write {
  type: 'Write';
  fd: string;
  data: Buffer | Uint8Array | string;
}

export interface End {
  type: 'End';
  fd: string;
}

export interface OpenResult {
  fd: string;
}

/**
 * Use from the renderer process to easily send messages to the main process.
 */
export class Client {
  public constructor(
    protected readonly ipcChannel = channel,
    protected readonly ipcRenderer = electron.ipcRenderer,
  ) {}

  protected async invoke(...args: unknown[]): Promise<unknown> {
    return this.ipcRenderer.invoke(this.ipcChannel, ...args);
  }

  async open(path: Open['path']): Promise<OpenResult> {
    const input: Open = { type: 'Open', path };
    return (await this.invoke(input)) as OpenResult;
  }

  async write(fd: Write['fd'], data: Write['data']): Promise<void> {
    const input: Write = { type: 'Write', fd, data };
    await this.invoke(input);
  }

  async end(fd: Write['fd']): Promise<void> {
    const input: End = { type: 'End', fd };
    await this.invoke(input);
  }
}

export function open(
  files: OpenFiles,
  permissions: readonly OriginFilePermission[],
  origin: string,
  input: Open,
): OpenResult {
  if (!isAbsolute(input.path)) {
    debug('aborting request because it is not an absolute path');
    throw new Error(`requested path is not absolute: ${input.path}`);
  }

  assertHasWriteAccess(permissions, origin, input.path);
  const fd = files.open(origin, input.path);
  debug(
    '%s: %s opened %s for writing as fd=%s',
    input.type,
    origin,
    input.path,
    fd,
  );
  return { fd };
}

export async function write(
  files: OpenFiles,
  permissions: readonly OriginFilePermission[],
  origin: string,
  input: Write,
): Promise<void> {
  assertHasWriteAccess(permissions, origin);
  const openFile = files.get(origin, input.fd);

  if (!openFile) {
    debug('%s: %s has no open file with fd=%s', input.type, origin, input.fd);
    throw new Error(`ENOENT: no such file with descriptor '${input.fd}'`);
  }

  debug(
    '%s: filePath=%s; data length=%d',
    input.type,
    openFile.path,
    input.data.length,
  );
  return new Promise((resolve, reject) => {
    openFile.write(input.data, (err) => (err ? reject(err) : resolve()));
  });
}

export async function end(
  files: OpenFiles,
  permissions: readonly OriginFilePermission[],
  origin: string,
  input: End,
): Promise<void> {
  assertHasWriteAccess(permissions, origin);
  const openFile = files.get(origin, input.fd);

  if (!openFile) {
    debug('%s: %s has no open file with fd=%s', input.type, origin, input.fd);
    throw new Error(`ENOENT: no such file with descriptor '${input.fd}'`);
  }

  debug('%s: filePath=%s', input.type, openFile.path);
  await files.close(origin, input.fd);
}

export default function register(
  ipcMain: IpcMain,
  { options }: { options: Options },
): void {
  const files = new OpenFiles();

  async function handler(
    event: IpcMainInvokeEvent,
    input: Open,
  ): Promise<OpenResult>;
  async function handler(
    event: IpcMainInvokeEvent,
    input: Write,
  ): Promise<void>;
  async function handler(event: IpcMainInvokeEvent, input: End): Promise<void>;
  async function handler(
    event: IpcMainInvokeEvent,
    input: Open | Write | End,
  ): Promise<OpenResult | void> {
    const url = new URL(event.sender.getURL());
    const origin = url.origin;

    switch (input.type) {
      case 'Open':
        return open(files, options.originFilePermissions, origin, input);

      case 'Write':
        return await write(files, options.originFilePermissions, origin, input);

      case 'End':
        return await end(files, options.originFilePermissions, origin, input);
    }
  }

  ipcMain.handle(channel, handler);
}
