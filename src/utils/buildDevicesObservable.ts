import { IpcRenderer } from 'electron';
import { channel as deviceSubscriptionChannel } from '../ipc/device-subscription';
import buildIpcMainForwardingObservable from './buildIpcMainForwardingObservable';

/**
 * Build a new observable that yields the current set of connected USB devices
 * as devices are added and removed.
 *
 * Given a set of initial devices (e.g. {mouse, keyboard}), a subscriber would
 * receive the initial set. Once a new device is added (e.g. flash drive), that
 * first subscriber receives a new set (e.g. {mouse, keyboard, flash drive}).
 * New subscribers immediately receive the same current set.
 */
const buildDevicesObservable = (
  ipcRenderer: IpcRenderer,
): KioskBrowser.Observable<Iterable<KioskBrowser.Device>> =>
  buildIpcMainForwardingObservable<Iterable<KioskBrowser.Device>>(
    ipcRenderer,
    deviceSubscriptionChannel,
  );

export default buildDevicesObservable;
