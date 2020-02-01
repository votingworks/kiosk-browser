import { IpcMain } from 'electron'
import readFile from '../utils/readFile'

enum BatteryStatus {
  Charging = 'Charging',
  Discharging = 'Discharging',
  NotCharging = 'Not charging',
  Full = 'Full',
  Unknown = 'Unknown',
}

export interface BatteryInfo {
  level: number
  discharging: boolean
}

export const channel = 'get-battery-info'

/**
 * Get battery info for the main system battery.
 */
export async function getBatteryInfo(): Promise<BatteryInfo> {
  for (const batteryPath of ['BAT0', 'BAT1']) {
    try {
      return parseBatteryInfo(
        await readFile(`/sys/class/power_supply/${batteryPath}/uevent`),
      )
    } catch {}
  }

  throw new Error(
    'No batteries found; perhaps /sys/class/power_supply is not available?',
  )
}

/**
 * Parses battery info text in `uevent` format.
 */
export function parseBatteryInfo(batteryInfoText: string): BatteryInfo {
  const batteryInfo = batteryInfoText.split('\n').reduce((data, line) => {
    const [key, value] = line.split('=')
    data.set(key, value)
    return data
  }, new Map<string, string>())

  const energyNow = batteryInfo.get('POWER_SUPPLY_ENERGY_NOW')
  const energyFull = batteryInfo.get('POWER_SUPPLY_ENERGY_FULL')
  const status = batteryInfo.get('POWER_SUPPLY_STATUS') as BatteryStatus
  const level = Number(energyNow) / Number(energyFull)
  const discharging = status === BatteryStatus.Discharging

  return { level, discharging }
}

export default function register(ipcMain: IpcMain): void {
  ipcMain.handle(channel, () => getBatteryInfo())
}
