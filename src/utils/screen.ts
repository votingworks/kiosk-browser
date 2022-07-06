import exec from './exec';
import xrandrParse, { Screen } from 'xrandr-parse';

/**
 * Gets information about the main screen.
 */
export function getMainScreen(): Screen | undefined {
  const { stdout } = exec('xrandr', ['--query']);
  const screens = xrandrParse(
    stdout.replace(/connected primary/g, 'connected'),
  ); // xrandr-parse doesn't understand "primary"

  for (const name in screens) {
    /* istanbul ignore else */
    if (Object.prototype.hasOwnProperty.call(screens, name)) {
      const screen = screens[name];

      if (screen.connected) {
        return screen;
      }
    }
  }
}
