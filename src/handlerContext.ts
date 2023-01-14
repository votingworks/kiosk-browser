import { Observable } from 'rxjs';
import { Options } from './utils/options';

export interface HandlerContext {
  options: Options;
  changedDevices: Observable<Iterable<KioskBrowser.Device>>;
  autoconfiguredPrinter: Observable<void>;
}
