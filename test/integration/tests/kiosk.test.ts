import { waitFor } from '../support/minitest';

// Declare `kiosk` as a definitely defined global variable
declare let kiosk: KioskBrowser.Kiosk;

// This isn't actually Jest, so we can't use `jest`.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
declare let jest: never;

test('storage', async () => {
  await kiosk.storage.clear();
  await kiosk.storage.set('some-key', { some: 'value' });
  expect(await kiosk.storage.get('some-key')).toEqual({ some: 'value' });
});

test('file system', async () => {
  const root = `/tmp/kiosk-test-${Math.round(Math.random() * 100_000)}`;
  await kiosk.makeDirectory(root, { recursive: true });

  await kiosk.writeFile(`${root}/test.txt`, 'string file content');
  expect(await kiosk.readFile(`${root}/test.txt`, 'utf8')).toEqual(
    'string file content',
  );

  await kiosk.writeFile(`${root}/test.bin`, Uint8Array.of(1, 2, 3));
  expect(await kiosk.readFile(`${root}/test.bin`)).toEqual(
    Uint8Array.of(1, 2, 3),
  );
});

test('battery', async () => {
  const batteryInfo = await kiosk.getBatteryInfo();

  if (batteryInfo) {
    expect(batteryInfo).toEqual({
      discharging: expect.any(Boolean) as boolean,
      level: expect.any(Number) as number,
    });
    expect(batteryInfo.level).toBeGreaterThanOrEqual(0);
    expect(batteryInfo.level).toBeLessThanOrEqual(1);
  }
});

test('print to PDF', async () => {
  const pdf = await kiosk.printToPDF();
  const prelude = '%PDF-1.4';
  expect(pdf).toBeInstanceOf(Uint8Array);
  expect(
    Array.from(pdf.slice(0, prelude.length))
      .map((c) => String.fromCharCode(c))
      .join(''),
  ).toEqual(prelude);
});

test('devices', async () => {
  let devices: KioskBrowser.Device[] | undefined;

  const unsubscribe = kiosk.devices.subscribe((newDevices) => {
    devices = [...newDevices];
  });

  await waitFor(() => {
    expect(devices).toBeInstanceOf(Array);
  });

  unsubscribe();
});

// TODO: remove `.skip` once we've figured out why this test causes a crash:
//
//   Assertion 'udev->n_ref > 0' failed at src/libudev/libudev.c:106, function udev_unref(). Aborting.
//
test.skip('printers', async () => {
  let printers: KioskBrowser.PrinterInfo[] | undefined;

  const unsubscribe = kiosk.printers.subscribe((newPrinters) => {
    printers = [...newPrinters];
  });

  await waitFor(
    () => {
      expect(printers).toBeInstanceOf(Array);
    },
    { timeout: 10_000 },
  );

  unsubscribe();
});

// force tooling to consider this a module
export {};
