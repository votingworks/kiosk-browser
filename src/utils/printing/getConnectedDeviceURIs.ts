import exec from '../exec';
import { debug } from '.';

/**
 * Gets the URIs of any connected printers matching the given schemes.
 */
export default async function getConnectedDeviceURIs(
  schemes?: Set<string>,
): Promise<Set<string>> {
  const lpinfoArgs: string[] = [];

  if (schemes?.size) {
    lpinfoArgs.push(
      '--include-schemes',
      Array.from(schemes).join(','), // e.g. usb
    );
  }

  // Show available devices with `-v` vs available drivers with `-m`.
  lpinfoArgs.push('-v');

  debug('getting connected device URIs from lpinfo, args=%o', lpinfoArgs);
  const { stdout, stderr } = await exec('lpinfo', lpinfoArgs);
  debug('lpinfo stdout:\n%s', stdout);
  debug('lpinfo stderr:\n%s', stderr);

  const deviceURIs = new Set(
    stdout
      .split('\n')
      .map((line) => line.split(/\s+/, 2)[1])
      .filter(Boolean),
  );
  debug('parsed lpinfo output as %O', deviceURIs);
  return deviceURIs;
}
