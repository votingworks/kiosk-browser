import { IpcMain } from 'electron'
import * as fs from 'fs'
import { promisify } from 'util'

const readFile = promisify(fs.readFile)

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
  const batteryInfoText = await readFile(
    '/sys/class/power_supply/BAT0/uevent',
    'utf8',
  )

  const batteryInfo = batteryInfoText.split('\n').reduce((data, line) => {
    const [key, value] = line.split('=')
    data.set(key, value)
    return data
  }, new Map<string, string>())

  const energyNow = batteryInfo.get('POWER_SUPPLY_ENERGY_NOW')
  const energyFull = batteryInfo.get('POWER_SUPPLY_ENERGY_FULL')
  const status = batteryInfo.get('POWER_SUPPLY_STATUS') as BatteryStatus
  const level = Number(energyNow) / Number(energyFull)
  const discharging =
    status !== BatteryStatus.Full && status !== BatteryStatus.Charging

  return { level, discharging }
}

export default function register(ipcMain: IpcMain): void {
  ipcMain.handle(channel, () => getBatteryInfo())
}
