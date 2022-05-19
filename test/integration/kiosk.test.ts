import { strict as assert } from 'assert';
import { test } from './minitest';

// Declare `kiosk` as a definitely defined global variable
declare let kiosk: KioskBrowser.Kiosk;

test('storage', async () => {
  await kiosk.storage.clear();
  await kiosk.storage.set('some-key', { some: 'value' });
  const value = (await kiosk.storage.get('some-key')) as
    | { some: string }
    | undefined;
  assert.equal(value?.some, 'value');
});

test('file system', async () => {
  const root = `/tmp/kiosk-test-${Math.round(Math.random() * 100_000)}`;
  await kiosk.makeDirectory(root, { recursive: true });

  await kiosk.writeFile(`${root}/test.txt`, 'string file content');
  assert.equal(
    await kiosk.readFile(`${root}/test.txt`, 'utf8'),
    'string file content',
  );

  await kiosk.writeFile(`${root}/test.bin`, Uint8Array.of(1, 2, 3));
  const binaryFileData = await kiosk.readFile(`${root}/test.bin`);
  assert(binaryFileData instanceof Uint8Array);
  assert.equal(Array.from(binaryFileData).join(','), '1,2,3');
});

test('battery', async () => {
  const batteryInfo = await kiosk.getBatteryInfo();

  if (batteryInfo) {
    assert(typeof batteryInfo.discharging === 'boolean');
    assert(batteryInfo.level >= 0 && batteryInfo.level <= 1);
  }
});

test('print to PDF', async () => {
  const pdf = await kiosk.printToPDF();
  assert(pdf instanceof Uint8Array);

  assert.equal(
    Array.from(pdf.slice(0, 4))
      .map((c) => String.fromCharCode(c))
      .join(''),
    '%PDF',
  );
});
