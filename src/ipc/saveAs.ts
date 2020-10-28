import makeDebug from 'debug'
import {
  dialog,
  IpcMain,
  IpcMainInvokeEvent,
  ipcRenderer,
  SaveDialogOptions,
} from 'electron'
import { hasWriteAccess } from '../utils/access'
import OpenFiles from '../utils/OpenFiles'
import { Options } from '../utils/options'

const debug = makeDebug('kiosk-browser:saveAs')

export const channel = 'saveAs'

export interface PromptToSave {
  type: 'PromptToSave'
  options?: PromptToSaveOptions
}

export type PromptToSaveOptions = Pick<
  SaveDialogOptions,
  'title' | 'defaultPath' | 'buttonLabel' | 'filters'
>
export type PromptToSaveResult =
  | { type: 'file'; fd: number }
  | { type: 'cancel' }

export interface Write {
  type: 'Write'
  fd: number
  data: Buffer | Uint8Array | string
}

export interface End {
  type: 'End'
  fd: number
}

/**
 * Use from the renderer process to easily send messages to the main process.
 */
export class Client {
  public constructor(
    private readonly invoke = ipcRenderer.invoke.bind(ipcRenderer),
  ) {}

  async promptToSave(
    options?: PromptToSaveOptions,
  ): Promise<PromptToSaveResult> {
    const input: PromptToSave = { type: 'PromptToSave', options }
    return await this.invoke(channel, input)
  }

  async write(fd: Write['fd'], data: Write['data']): Promise<void> {
    const input: Write = { type: 'Write', fd, data }
    return await this.invoke(channel, input)
  }

  async end(fd: Write['fd']): Promise<void> {
    const input: End = { type: 'End', fd }
    return await this.invoke(channel, input)
  }
}

/**
 * Allows opening a file for writing.
 */
export default function register(ipcMain: IpcMain, options: Options): void {
  const files = new OpenFiles()

  async function handler(
    event: IpcMainInvokeEvent,
    input: PromptToSave,
  ): Promise<PromptToSaveResult>
  async function handler(event: IpcMainInvokeEvent, input: Write): Promise<void>
  async function handler(event: IpcMainInvokeEvent, input: End): Promise<void>
  async function handler(
    event: IpcMainInvokeEvent,
    input: PromptToSave | Write | End,
  ): Promise<PromptToSaveResult | void> {
    const url = new URL(event.sender.getURL())
    const hostname = url.hostname || url.toString()

    if (!hasWriteAccess(options.hostFilePermissions, hostname)) {
      debug(
        '%s: aborting because %s is not allowed to write anywhere (permissions=%o)',
        input.type,
        hostname,
        options.hostFilePermissions,
      )
      throw new Error(`${hostname ?? url} is not allowed to write to disk`)
    }

    switch (input.type) {
      case 'PromptToSave': {
        const result = await dialog.showSaveDialog(input.options ?? {})
        debug('%s: filePath=%s', input.type, result.filePath)

        if (!result.filePath) {
          debug('%s: aborting because save dialog was canceled', input.type)
          return { type: 'cancel' }
        }

        if (
          !hasWriteAccess(
            options.hostFilePermissions,
            hostname,
            result.filePath,
          )
        ) {
          debug(
            '%s: aborting because %s is not allowed to write to %s (permissions=%o)',
            input.type,
            hostname,
            result.filePath,
            options.hostFilePermissions,
          )
          throw new Error(
            `${hostname ?? url} is not allowed to write to the chosen location`,
          )
        }

        const fd = files.open(hostname, result.filePath)
        debug(
          '%s: opened %s for writing as fd=%d',
          input.type,
          result.filePath,
          fd,
        )
        return { type: 'file', fd }
      }

      case 'Write': {
        const openFile = files.get(hostname, input.fd)

        if (!openFile) {
          debug('%s: no file with fd=%d in hostname=%s', input.fd, hostname)
          throw new Error(`ENOENT: no such file with descriptor '${input.fd}'`)
        }

        debug(
          '%s: filePath=%s; data length=%d',
          input.type,
          openFile.path,
          input.data.length,
        )
        return new Promise((resolve, reject) => {
          openFile.write(input.data, err => (err ? reject(err) : resolve()))
        })
      }

      case 'End': {
        const openFile = files.get(hostname, input.fd)

        if (!openFile) {
          debug('%s: no file with fd=%d in hostname=%s', input.fd, hostname)
          throw new Error(`ENOENT: no such file with descriptor '${input.fd}'`)
        }

        debug('%s: filePath=%s', input.type, openFile.path)
        await files.close(hostname, input.fd)
        break
      }

      default:
        throw new Error(`unknown action type: '${input['type']}'`)
    }
  }

  ipcMain.handle(channel, handler)
}
