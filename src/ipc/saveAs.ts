import makeDebug from 'debug'
import {
  dialog,
  IpcMain,
  IpcMainInvokeEvent,
  IpcRenderer,
  SaveDialogOptions,
} from 'electron'
import { assertHasWriteAccess, OriginFilePermission } from '../utils/access'
import OpenFiles from '../utils/OpenFiles'
import { Options } from '../utils/options'
import {
  Client as WriteFileClient,
  End,
  end,
  write,
  Write,
} from './file-system-write-file'

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

/**
 * Use from the renderer process to easily send messages to the main process.
 */
export class Client extends WriteFileClient {
  public constructor(ipcRenderer?: IpcRenderer) {
    super(channel, ipcRenderer)
  }

  async promptToSave(
    options?: PromptToSaveOptions,
  ): Promise<PromptToSaveResult> {
    const input: PromptToSave = { type: 'PromptToSave', options }
    return (await this.invoke(input)) as PromptToSaveResult
  }
}

async function handlePromptToSave(
  files: OpenFiles,
  origin: string,
  permissions: readonly OriginFilePermission[],
  input: PromptToSave,
): Promise<PromptToSaveResult> {
  const result = await dialog.showSaveDialog(input.options ?? {})
  debug('%s: filePath=%s', input.type, result.filePath)

  if (!result.filePath) {
    debug('%s: aborting because save dialog was canceled', input.type)
    return { type: 'cancel' }
  }

  assertHasWriteAccess(permissions, origin, result.filePath)

  const fd = files.open(origin, result.filePath)
  debug('%s: opened %s for writing as fd=%d', input.type, result.filePath, fd)
  return { type: 'file', fd }
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
    const origin = url.origin
    assertHasWriteAccess(options.originFilePermissions, origin)

    switch (input.type) {
      case 'PromptToSave':
        return await handlePromptToSave(
          files,
          origin,
          options.originFilePermissions,
          input,
        )

      case 'Write':
        return await write(files, options.originFilePermissions, origin, input)

      case 'End':
        return await end(files, options.originFilePermissions, origin, input)

      default:
        throw new Error(`unknown action type: '${input['type']}'`)
    }
  }

  ipcMain.handle(channel, handler)
}
