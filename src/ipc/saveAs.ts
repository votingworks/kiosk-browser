import makeDebug from 'debug'
import { dialog, IpcMain, IpcMainInvokeEvent, ipcRenderer } from 'electron'
import { createWriteStream, WriteStream } from 'fs'

const debug = makeDebug('kiosk-browser:saveAs')

export const channel = 'saveAs'

export interface PromptToSave {
  type: 'PromptToSave'
}

export type PromptToSaveResult = { fd: number } | undefined

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

  async promptToSave(): Promise<PromptToSaveResult> {
    const input: PromptToSave = { type: 'PromptToSave' }
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
export default function register(ipcMain: IpcMain): void {
  let fd = 0
  const openFiles = new Map<number, WriteStream>()

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
    switch (input.type) {
      case 'PromptToSave': {
        const result = await dialog.showSaveDialog({})
        debug('%s: filePath=%s', input.type, result.filePath)

        if (!result.filePath) {
          return
        }

        fd += 1
        openFiles.set(fd, createWriteStream(result.filePath))
        return { fd }
      }

      case 'Write': {
        const openFile = openFiles.get(input.fd)

        if (!openFile) {
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
        const openFile = openFiles.get(input.fd)

        if (!openFile) {
          throw new Error(`ENOENT: no such file with descriptor '${input.fd}'`)
        }

        debug('%s: filePath=%s', input.type, openFile.path)
        return new Promise(resolve => {
          openFile.end(() => {
            openFiles.delete(input.fd)
            resolve()
          })
        })
      }

      default:
        throw new Error(`unknown action type: '${input['type']}'`)
    }
  }

  ipcMain.handle(channel, handler)
}
