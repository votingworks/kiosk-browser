import execSync from '../execSync';
import { debug } from '.';
import { ok } from '../assert';

const lpstatDeviceLinePattern = /^device for (.+): (.+)$/;

export default function getPrinterDeviceURI(
  printerName: string,
): string | undefined {
  const lpstatArgs = ['-v', printerName];
  debug('getting printer device URI from `lpstat` with args=%o', lpstatArgs);

  let stdout: string;
  let stderr: string;

  try {
    ({ stdout, stderr } = execSync('lpstat', ['-v', printerName]));
  } catch (error) {
    debug('`lpstat` failed with error: %O', error);
    return undefined;
  }

  debug('`lpstat` call returned stdout=%s, stderr=%s', stdout, stderr);

  const match = lpstatDeviceLinePattern.exec(stdout.trim());

  if (match) {
    const [deviceName, deviceURI] = match.slice(1);

    debug('parsed `lpstat` output device URI: %s', deviceURI);
    ok(
      deviceName === printerName,
      `lpstat returned a different printer than requested: ${deviceName} != ${printerName}`,
    );

    return deviceURI;
  }
}
