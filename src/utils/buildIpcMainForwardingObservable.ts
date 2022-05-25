import makeDebug from 'debug';
import { IpcRenderer, IpcRendererEvent } from 'electron';

const debug = makeDebug('kiosk-browser:client:ipc');

/**
 * Builds an observable for values sent from the main process over IPC.
 */
const buildIpcMainForwardingObservable = <T>(
  ipcRenderer: IpcRenderer,
  channel: string,
): KioskBrowser.Observable<T> => {
  debug('building observable for channel: %s', channel);
  return {
    subscribe: (callback) => {
      debug('subscribing to channel: %s', channel);

      // set up listener for channel
      const listener = (event: IpcRendererEvent, arg: T) => {
        debug('received event on channel: %s', channel);
        callback(arg);
      };

      // starting listening
      ipcRenderer.on(channel, listener);

      // begin subscription
      void ipcRenderer.invoke(channel, { subscribe: true });

      return () => {
        debug('unsubscribing from channel: %s', channel);

        // stop listening
        ipcRenderer.off(channel, listener);

        // end subscription
        void ipcRenderer.invoke(channel, { subscribe: false });
      };
    },
  };
};

export default buildIpcMainForwardingObservable;
