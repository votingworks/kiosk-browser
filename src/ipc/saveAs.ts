import makeDebug from 'debug'
import { dialog, IpcMain, IpcMainInvokeEvent, ipcRenderer } from 'electron'
import multimatch from 'multimatch'
import { Options } from '../utils/options'
import OpenFiles from '../utils/OpenFiles'

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

function matchesPatterns(value: string, patterns?: readonly string[]): boolean {
  if (!patterns) {
    return false
  }

  return multimatch(value, patterns as string[]).length > 0
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

    if (!matchesPatterns(hostname, options.allowedSaveAsHostnamePatterns)) {
      debug(
        '%s: aborting because %s is not an allowed hostname (allowed patterns=%o)',
        input.type,
        hostname,
        options.allowedSaveAsHostnamePatterns,
      )
      throw new Error(`${hostname ?? url} is not allowed to use 'saveAs'`)
    }

    switch (input.type) {
      case 'PromptToSave': {
        const result = await dialog.showSaveDialog({})
        debug('%s: filePath=%s', input.type, result.filePath)

        if (!result.filePath) {
          debug('%s: aborting because save dialog was canceled', input.type)
          return
        }

        if (
          !matchesPatterns(
            result.filePath,
            options.allowedSaveAsDestinationPatterns,
          )
        ) {
          debug(
            '%s: aborting because %s is not an allowed destination (allowed patterns=%o)',
            input.type,
            result.filePath,
            options.allowedSaveAsDestinationPatterns,
          )
          return
        }

        const fd = files.open(hostname, result.filePath)
        debug(
          '%s: opened %s for writing as fd=%d',
          input.type,
          result.filePath,
          fd,
        )
        return { fd }
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
