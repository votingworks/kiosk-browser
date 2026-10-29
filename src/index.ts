import {
  app,
  BrowserWindow,
  ipcMain,
  IpcMain,
  globalShortcut,
  screen,
} from 'electron';
import { join } from 'path';
import registerShowOpenDialog from './ipc/show-open-dialog';
import registerQuitHandler from './ipc/quit';
import registerLogHandler from './ipc/log';
import registerCaptureScreenshot from './ipc/capture-screenshot';
import registerRebootHandler from './ipc/reboot';
import allowSelfCapture from './display-media';
import parseOptions, { printHelp } from './utils/options';
import { HandlerContext } from './handlerContext';

export type RegisterIpcHandler = (
  ipcMain: IpcMain,
  { options }: HandlerContext,
) => (() => void) | void;

// Allow use of `speechSynthesis` API.
app.commandLine.appendSwitch('enable-speech-dispatcher');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow: Electron.BrowserWindow | undefined;

function createWindow(): void {
  const parseOptionsResult = parseOptions(
    // https://github.com/electron/electron/issues/4690
    process.argv.slice(app.isPackaged ? 1 : 2),
    process.env,
  );

  if ('error' in parseOptionsResult) {
    console.error(`error: ${parseOptionsResult.error.message}`);
    printHelp(process.stderr);
    app.exit(1);
    return;
  } else if ('help' in parseOptionsResult) {
    printHelp();
    app.exit();
    return;
  }

  const { options } = parseOptionsResult;

  const { width, height } = screen.getPrimaryDisplay().size;
  const allowDevtools = options.allowDevtools || !app.isPackaged;

  // Create the browser window.
  mainWindow = new BrowserWindow({
    width,
    height,
    kiosk: true,
    frame: false,
    roundedCorners: false,
    webPreferences: {
      devTools: allowDevtools,
      preload: join(__dirname, 'preload.js'),
      sandbox: false,
    },
  });
  // Don't allow opening new windows (e.g. by middle-clicking on a link)
  mainWindow.webContents.setWindowOpenHandler(() => {
    return { action: 'deny' };
  });

  allowSelfCapture(mainWindow.webContents.session);

  // and load the initial page.
  void mainWindow.loadURL(options.url.href);

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()

  // Register IPC handlers.
  const handlers: RegisterIpcHandler[] = [
    registerQuitHandler,
    registerShowOpenDialog,
    registerLogHandler,
    registerCaptureScreenshot,
    registerRebootHandler,
  ];

  const handlerCleanups = handlers
    .map((handler) =>
      handler(ipcMain, {
        options,
      }),
    )
    .filter(Boolean) as (() => void)[];

  function quit(): void {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = undefined;

    // Clean up and quit since we only ever open one window.
    for (const cleanup of handlerCleanups) {
      cleanup();
    }

    // Quit the app.
    app.quit();
  }

  // Emitted when the window is closed.
  mainWindow.on('closed', quit);
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
  // Register global shortcuts to prevent problematic keyboard shortcuts
  globalShortcut.register('Control+M', () => {
    // Do nothing to prevent minimize behavior
  });

  createWindow();
});

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // Unregister all global shortcuts when the app is closing
  globalShortcut.unregisterAll();
  app.quit();
});

// Clean up global shortcuts when the app is about to quit
app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});
