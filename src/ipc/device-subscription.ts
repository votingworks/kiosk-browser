import makeDebug from 'debug';
import { IpcMainInvokeEvent, WebContents } from 'electron';
import { Subscription } from 'rxjs';
import { RegisterIpcHandler } from '..';

const debug = makeDebug('kiosk-browser:device-subscription');

export const channel = 'device-subscription';

/**
 * Subscribe to add/remove USB device events.
 */
export const register: RegisterIpcHandler = (ipcMain, { changedDevices }) => {
  debug('registering handler with channel: %s', channel);
  const subscriptions = new Map<WebContents, Subscription>();

  ipcMain.handle(
    channel,
    (event: IpcMainInvokeEvent, { subscribe }: { subscribe: boolean }) => {
      debug(
        'received request to subscribe/unsubscribe: subscribe=%s',
        subscribe,
      );
      const webContents = event.sender;
      const subscription = subscriptions.get(webContents);

      // Always remove the old subscription as there's only one per WebContents.
      subscription?.unsubscribe();

      if (subscribe) {
        debug('subscribing to device changes');
        const subscription = changedDevices.subscribe((set) =>
          webContents.send(channel, Array.from(set)),
        );

        subscriptions.set(webContents, subscription);
        webContents.on('destroyed', () => {
          subscription.unsubscribe();
          subscriptions.delete(webContents);
        });
      } else if (!subscribe) {
        subscriptions.delete(webContents);
      }
    },
  );
};

export default register;
