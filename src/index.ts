import { app, BrowserWindow, ipcMain, IpcMain } from 'electron'
import { join } from 'path'
import { getMainScreen } from './utils/screen'
import { onDeviceChange } from './utils/usb'
import parseOptions, { printHelp } from './utils/options'
import autoconfigurePrint from './utils/printing/autoconfigurePrinter'
import registerPrintHandler from './ipc/print'
import registerGetBatteryInfoHandler from './ipc/get-battery-info'
import registerGetPrinterInfoHandler from './ipc/get-printer-info'
import registerGetDeviceListHandler from './ipc/get-device-list'
import registerManageDeviceSubscription from './ipc/manage-device-subscription'

type RegisterIpcHandler = (ipcMain: IpcMain) => (() => void) | void

// Allow use of `speechSynthesis` API.
app.commandLine.appendSwitch('enable-speech-dispatcher')

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow: Electron.BrowserWindow | undefined

async function createWindow(): Promise<void> {
  const mainScreen = await getMainScreen()

  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: mainScreen?.width ?? 800,
    height: mainScreen?.height ?? 600,
    kiosk: true,
    frame: false,
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
    },
  })

  const options = await parseOptions(
    // https://github.com/electron/electron/issues/4690
    process.argv.slice(app.isPackaged ? 1 : 2),
    process.env,
  )

  if ('error' in options) {
    console.log(`error: ${options.error.message}`)
    printHelp()
    app.quit()
    return
  } else if ('help' in options) {
    printHelp()
    app.quit()
    return
  }

  const autoconfigurePrinterListener =
    options.autoconfigurePrintConfig &&
    autoconfigurePrint(options.autoconfigurePrintConfig, onDeviceChange)

  // and load the initial page.
  mainWindow.loadURL(options.url.href)

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()

  // Register IPC handlers.
  const handlers: RegisterIpcHandler[] = [
    registerPrintHandler,
    registerGetBatteryInfoHandler,
    registerGetPrinterInfoHandler,
    registerGetDeviceListHandler,
    registerManageDeviceSubscription,
  ]

  const handlerCleanups = handlers
    .map(handler => handler(ipcMain))
    .filter(Boolean) as (() => void)[]

  function quit(): void {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = undefined

    // Clean up and quit since we only ever open one window.
    for (const cleanup of handlerCleanups) {
      cleanup()
    }

    // Stop printer autoconfigure.
    autoconfigurePrinterListener?.remove()

    // Quit the app.
    app.quit()
  }

  // Emitted when the window is closed.
  mainWindow.on('closed', quit)
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
  createWindow()
})

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === undefined) {
    createWindow()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
