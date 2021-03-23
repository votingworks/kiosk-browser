import { IpcMain, IpcMainInvokeEvent, IpcRenderer, WebContents } from 'electron'

type Input =
  | string
  | number
  | null
  | Input[]
  | { [key: string]: Input }
  | Buffer
  | Uint8Array

type Mapping<T extends Input> = T extends Buffer ? Uint8Array : T

/**
 * Sending data through IPC might change its format a little bit, and this
 * emulates that.
 */
function roundTripData<T extends Input>(data: T): Mapping<T> {
  if (Buffer.isBuffer(data)) {
    return Uint8Array.from(data) as Mapping<T>
  } else if (Array.isArray(data)) {
    return data.map(roundTripData) as Mapping<T>
  } else if (
    typeof data === 'object' &&
    Object.getPrototypeOf(data) === Object.prototype
  ) {
    return Object.fromEntries(
      Object.entries(data as object).map(([key, value]) => [
        key,
        roundTripData(value),
      ]),
    ) as Mapping<T>
  } else {
    return data as Mapping<T>
  }
}

type IpcMainListener = Parameters<IpcMain['handle']>[1]

/**
 * A very low-fidelity fake `IpcMain`/`IpcRenderer` pair, suitable for narrow
 * testing of invoking registered handlers.
 */
export function fakeIpc(
  sender: Partial<WebContents> = {},
): {
  ipcMain: IpcMain
  ipcRenderer: IpcRenderer
  setWebContents(sender: Partial<WebContents>): void
} {
  let webContents: Partial<WebContents>

  function setWebContents(sender: Partial<WebContents>): void {
    webContents = { getURL: (): string => 'https://example.com/', ...sender }
  }

  setWebContents(sender)

  const listeners = new Map<string, IpcMainListener>()

  const ipcMain: Partial<IpcMain> = {
    handle: jest.fn(function handle(
      channel: string,
      listener: IpcMainListener,
    ): void {
      listeners.set(channel, listener)
    }),
  }

  const ipcRenderer: Partial<IpcRenderer> = {
    invoke: jest.fn(async function invoke(
      channel: string,
      ...args: unknown[]
    ): Promise<unknown> {
      const listener = listeners.get(channel)

      if (!listener) {
        throw new Error(`No handler registered for '${channel}'`)
      }

      return roundTripData(
        await listener(
          ({
            sender: webContents,
          } as unknown) as IpcMainInvokeEvent,
          ...args.map(arg => roundTripData(arg as Input)),
        ),
      )
    }),
  }

  return {
    ipcMain: (ipcMain as unknown) as IpcMain,
    ipcRenderer: (ipcRenderer as unknown) as IpcRenderer,
    setWebContents,
  }
}
