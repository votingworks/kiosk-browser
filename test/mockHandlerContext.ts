import { Subject } from 'rxjs';
import { HandlerContext } from '../src/handlerContext';
import { Options } from '../src/utils/options';

const changedDevices = new Subject<Iterable<KioskBrowser.Device>>();
const autoconfiguredPrinter = new Subject<void>();

type MockHanderContextOverride = Omit<Partial<HandlerContext>, 'options'> & {
  options: Partial<Options>;
};

export function mockHandlerContext(
  overrides?: MockHanderContextOverride,
): HandlerContext {
  return {
    changedDevices,
    autoconfiguredPrinter,
    ...overrides,
    options: {
      url: new URL('about:blank'),
      originFilePermissions: [],
      ...overrides?.options,
    },
  };
}
