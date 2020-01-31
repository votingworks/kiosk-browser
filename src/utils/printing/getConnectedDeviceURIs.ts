import exec from '../exec'

/**
 * Gets the URIs of any connected printers matching the given schemes.
 */
export default async function getConnectedDeviceURIs(
  schemes?: Set<string>,
): Promise<Set<string>> {
  const lpinfoArgs: string[] = []

  if (schemes?.size) {
    lpinfoArgs.push(
      '--include-schemes',
      Array.from(schemes).join(','), // e.g. usb
    )
  }

  // Show available devices with `-v` vs available drivers with `-m`.
  lpinfoArgs.push('-v')

  const { stdout } = await exec('lpinfo', lpinfoArgs)

  return new Set(stdout.split('\n').map(line => line.split(/\s+/, 2)[1]))
}
