import { IpcMain, IpcMainInvokeEvent, IpcRenderer, WebContents } from 'electron'
import { EventEmitter } from 'events'

export function fakeIpcPair(): [FakeIpcMain, FakeIpcRenderer] {
  const ipcMain = new FakeIpcMain()
  const ipcRenderer = new FakeIpcRenderer(ipcMain)

  return [ipcMain, ipcRenderer]
}

export class FakeIpcRenderer extends EventEmitter implements IpcRenderer {
  public constructor(private ipcMain: FakeIpcMain) {
    super()
  }

  public async invoke(channel: string, ...args: unknown[]): Promise<unknown> {
    return this.ipcMain.receive(channel, ...args)
  }

  public send(channel: string, ...args: unknown[]): void {
    this.ipcMain.receive(channel, ...args)
  }

  public sendSync(channel: string, ...args: unknown[]): void {
    this.send(channel, ...args)
  }

  public sendTo(
    webContentsId: number,
    channel: string,
    ...args: unknown[]
  ): void {
    throw new Error('not implemented')
  }

  public sendToHost(channel: string, ...args: any[]): void {
    throw new Error('not implemented')
  }
}

export class FakeIpcMainInvokeEvent extends Event {
  public constructor(public frameId: number, public sender: WebContents) {
    super('IpcMainInvokeEvent')
  }
}

export type IpcHandler = (
  event: IpcMainInvokeEvent,
  ...args: any[]
) => Promise<void> | any

// @ts-ignore
export const FakeWebContents: typeof WebContents = class extends EventEmitter
  implements WebContents {
  // TODO: fill in missing properties
}

export class FakeIpcMain extends EventEmitter implements IpcMain {
  private handlers = new Map<string, IpcHandler>()

  public handle(channel: string, listener: IpcHandler): void {
    this.handlers.set(channel, listener)
  }

  public handleOnce(channel: string, listener: IpcHandler): void {
    this.handle(channel, (event: IpcMainInvokeEvent, ...args: unknown[]) => {
      this.removeHandler(channel)
      return listener(event, ...args)
    })
  }

  public removeHandler(channel: string): void {
    this.handlers.delete(channel)
  }

  public async receive(channel: string, ...args: unknown[]): Promise<void> {
    const listener = this.handlers.get(channel)

    if (listener) {
      return listener(
        new FakeIpcMainInvokeEvent(0, new FakeWebContents()),
        ...args,
      )
    }
  }
}
