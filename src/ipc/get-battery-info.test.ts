import register, {
  parseBatteryInfo,
  getBatteryInfo,
  channel as getBatteryInfoChannel,
} from './get-battery-info'
import readFile from '../utils/readFile'
import mockOf from '../../test/mockOf'
import { IpcMain } from 'electron'

jest.mock('../utils/readFile', () => jest.fn())

const readFileMock = mockOf(readFile)

test('parses battery info to determine battery level and charging status', () => {
  expect(
    parseBatteryInfo(`
POWER_SUPPLY_ENERGY_NOW=800
POWER_SUPPLY_ENERGY_FULL=1000
POWER_SUPPLY_STATUS=Charging
`),
  ).toEqual({
    level: 0.8,
    discharging: false,
  })
})

test('parses battery status "Full" to indicate battery is not discharging', () => {
  expect(
    parseBatteryInfo(`
POWER_SUPPLY_ENERGY_NOW=800
POWER_SUPPLY_ENERGY_FULL=1000
POWER_SUPPLY_STATUS=Full
`),
  ).toEqual({
    level: 0.8,
    discharging: false,
  })
})

test('parses battery status "Discharging" to indicate battery is discharging', () => {
  expect(
    parseBatteryInfo(`
POWER_SUPPLY_ENERGY_NOW=800
POWER_SUPPLY_ENERGY_FULL=1000
POWER_SUPPLY_STATUS=Disharging
`),
  ).toEqual({
    level: 0.8,
    discharging: true,
  })
})

test('can read battery info for the main system battery', async () => {
  readFileMock.mockResolvedValue(`
POWER_SUPPLY_ENERGY_NOW=800
POWER_SUPPLY_ENERGY_FULL=1000
POWER_SUPPLY_STATUS=Disharging
`)

  expect(await getBatteryInfo()).toEqual({ level: 0.8, discharging: true })
  expect(readFileMock).toHaveBeenCalledWith(
    '/sys/class/power_supply/BAT0/uevent',
  )
})

test('registers a handler to get battery info', async () => {
  readFileMock.mockResolvedValue(`
POWER_SUPPLY_ENERGY_NOW=200
POWER_SUPPLY_ENERGY_FULL=1000
POWER_SUPPLY_STATUS=Disharging
`)

  let channel: string | undefined
  let listener: (() => unknown) | undefined

  function handle(ch: string, fn: () => void) {
    channel = ch
    listener = fn
  }

  register(({ handle } as unknown) as IpcMain)

  expect(channel).toEqual(getBatteryInfoChannel)
  expect(await listener?.()).toEqual({ level: 0.2, discharging: true })
})