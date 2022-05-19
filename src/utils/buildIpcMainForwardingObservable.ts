import { IpcRenderer, IpcRendererEvent } from 'electron';
import { defer, Observable, fromEvent } from 'rxjs';
import { map, tap, finalize, shareReplay } from 'rxjs/operators';
import makeDebug from 'debug';

const debug = makeDebug('kiosk-browser:client:ipc');

/**
 * Builds an observable for values sent from the main process over IPC.
 */
const buildIpcMainForwardingObservable = <T>(
  ipcRenderer: IpcRenderer,
  channel: string,
): Observable<T> => {
  debug('building observable for channel: %s', channel);
  return defer(() => {
    debug('subscribing to channel: %s', channel);
    void ipcRenderer.invoke(channel, { subscribe: true });
    return fromEvent<[IpcRendererEvent, T]>(ipcRenderer, channel);
  }).pipe(
    map(([, value]) => value),
    tap((value) =>
      debug('got value from IPC channel "%s": %O', channel, value),
    ),
    finalize(() => {
      debug('unsubscribing from channel: %s', channel);
      void ipcRenderer.invoke(channel, { subscribe: false });
    }),
    shareReplay({ refCount: true, bufferSize: 1 }),
  );
};

export default buildIpcMainForwardingObservable;
