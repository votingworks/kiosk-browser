import { IpcMain, IpcRenderer, WebContents, IpcMainInvokeEvent } from 'electron'

type Input =
  | string
  | number
  | null
  | { [key: string]: Input }
  | Buffer
  | Uint8Array

type Mapping<T extends Input> = T extends Buffer ? Uint8Array : T

function roundTripData<T extends Input>(data: T): Mapping<T> {
  return (Buffer.isBuffer(data) ? Uint8Array.from(data) : data) as Mapping<T>
}

type IpcMainListener = Parameters<IpcMain['handle']>[1]

/**
 * A very low-fidelity fake `IpcMain`/`IpcRenderer` pair, suitable for narrow
 * testing of invoking registered handlers.
 */
export function fakeIpc(
  sender: Partial<WebContents> = {},
): { ipcMain: IpcMain; ipcRenderer: IpcRenderer } {
  const listeners = new Map<string, IpcMainListener>()

  const ipcMain: Partial<IpcMain> = {
    handle(channel: string, listener: IpcMainListener): void {
      listeners.set(channel, listener)
    },
  }

  const ipcRenderer: Partial<IpcRenderer> = {
    async invoke(channel: string, ...args: unknown[]): Promise<unknown> {
      const listener = listeners.get(channel)

      if (!listener) {
        throw new Error(`No handler registered for '${channel}'`)
      }

      return roundTripData(
        await listener(({ sender } as unknown) as IpcMainInvokeEvent, ...args),
      )
    },
  }

  return {
    ipcMain: (ipcMain as unknown) as IpcMain,
    ipcRenderer: (ipcRenderer as unknown) as IpcRenderer,
  }
}
