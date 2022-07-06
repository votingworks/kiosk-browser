import exec from '../exec';
import configurePrinter from './configurePrinter';
import { PostScriptPrinterDefinition } from '.';

jest.mock('../exec');

test('configure with PPD file', () => {
  const printerName = 'Example_Printer';
  const deviceURI = 'usb://Example/Printer';
  const ppd: PostScriptPrinterDefinition = { path: '/example-printer.ppd' };

  configurePrinter({ printerName, deviceURI, ppd });

  expect(exec).toHaveBeenCalledTimes(1);
  expect(exec).toHaveBeenCalledWith('lpadmin', [
    '-p',
    printerName,
    '-v',
    deviceURI,
    '-E',
    '-P',
    ppd.path,
  ]);
});

test('configure with PPD model', () => {
  const printerName = 'Example_Printer';
  const deviceURI = 'usb://Example/Printer';
  const ppd: PostScriptPrinterDefinition = {
    model: 'foomatic://example-printer.ppd',
  };

  configurePrinter({ printerName, deviceURI, ppd });

  expect(exec).toHaveBeenCalledTimes(1);
  expect(exec).toHaveBeenCalledWith('lpadmin', [
    '-p',
    printerName,
    '-v',
    deviceURI,
    '-E',
    '-m',
    ppd.model,
  ]);
});

test('configure as default', () => {
  const printerName = 'Example_Printer';
  const deviceURI = 'usb://Example/Printer';
  const ppd: PostScriptPrinterDefinition = { path: '/example-printer.ppd' };

  configurePrinter({ printerName, deviceURI, ppd, setDefault: true });

  expect(exec).toHaveBeenCalledTimes(2);
  expect(exec).toHaveBeenNthCalledWith(2, 'lpadmin', ['-d', printerName]);
});
