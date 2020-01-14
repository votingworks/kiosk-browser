import { app, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { getMainScreen } from './utils/screen'
import getURL from './utils/getURL'
import registerPrintHandler from './ipc/print'
import registerGetBatteryInfoHandler from './ipc/get-battery-info'
import registerSpeakHandler from './ipc/tts'

// Allow use of `speechSynthesis` API.
app.commandLine.appendSwitch('enable-speech-dispatcher')

// Don't require user interaction before autoplay works. (https://github.com/electron/electron/issues/13525)
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required')

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

  const initialURL = getURL().href

  // and load the initial page.
  mainWindow.loadURL(initialURL)

  // Attempt to automatically fix crashes.
  mainWindow.webContents.on('crashed', () => {
    mainWindow?.reload()
    console.log('crashed!')
  })

  // Open the DevTools.
  mainWindow.webContents.openDevTools()

  // Register IPC handlers.
  registerPrintHandler(ipcMain)
  registerGetBatteryInfoHandler(ipcMain)
  registerSpeakHandler(ipcMain)

  // Emitted when the window is closed.
  mainWindow.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = undefined
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

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
