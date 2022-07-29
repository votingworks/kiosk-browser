import execSync from '../execSync';
import configurePrinter from './configurePrinter';
import { PostScriptPrinterDefinition } from '.';

jest.mock('../execSync');

test('configure with PPD file', () => {
  const printerName = 'Example_Printer';
  const deviceURI = 'usb://Example/Printer';
  const ppd: PostScriptPrinterDefinition = { path: '/example-printer.ppd' };

  configurePrinter({ printerName, deviceURI, ppd });

  expect(execSync).toHaveBeenCalledTimes(1);
  expect(execSync).toHaveBeenCalledWith('lpadmin', [
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

  expect(execSync).toHaveBeenCalledTimes(1);
  expect(execSync).toHaveBeenCalledWith('lpadmin', [
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

  expect(execSync).toHaveBeenCalledTimes(2);
  expect(execSync).toHaveBeenNthCalledWith(2, 'lpadmin', ['-d', printerName]);
});
