import { execFile } from 'child_process'
import { promisify } from 'util'
import xrandrParse, { Screen } from 'xrandr-parse'

const exec = promisify(execFile)

/**
 * Gets information about the main screen.
 */
export async function getMainScreen(): Promise<Screen | undefined> {
  const { stdout } = await exec('xrandr', ['--query'])
  const screens = xrandrParse(stdout.replace(/connected primary/g, 'connected')) // xrandr-parse doesn't understand "primary"

  for (const name in screens) {
    if (Object.prototype.hasOwnProperty.call(screens, name)) {
      const screen = screens[name]

      if (screen.connected) {
        return screen
      }
    }
  }
}
