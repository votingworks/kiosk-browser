// Declare `kiosk` as a definitely defined global variable
declare let kiosk: KioskBrowser.Kiosk;

const PNG_SIGNATURE = [137, 80, 78, 71, 13, 10, 26, 10];
test('screenshot', async () => {
  const screenshot = await kiosk.captureScreenshot();
  expect(screenshot).toBeInstanceOf(Uint8Array);
  expect(Array.from(screenshot.slice(0, PNG_SIGNATURE.length))).toEqual(
    PNG_SIGNATURE,
  );
});

// force tooling to consider this a module
export {};
