import { promises as fs } from 'fs'
import { fakeIpc } from '../../test/ipc'
import register, {
  channel as getBatteryInfoChannel,
  getBatteryInfo,
  parseBatteryInfo,
} from './get-battery-info'

afterEach(() => {
  jest.spyOn(fs, 'readFile').mockRestore()
})

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

test('parses battery status "Unknown" to indicate battery is not discharging', () => {
  expect(
    parseBatteryInfo(`
POWER_SUPPLY_ENERGY_NOW=800
POWER_SUPPLY_ENERGY_FULL=1000
POWER_SUPPLY_STATUS=Unknown
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
POWER_SUPPLY_STATUS=Discharging
`),
  ).toEqual({
    level: 0.8,
    discharging: true,
  })
})

test('can read battery info for the main system battery', async () => {
  const readFileMock = jest.spyOn(fs, 'readFile').mockResolvedValue(`
POWER_SUPPLY_ENERGY_NOW=800
POWER_SUPPLY_ENERGY_FULL=1000
POWER_SUPPLY_STATUS=Discharging
`)

  expect(await getBatteryInfo()).toEqual({ level: 0.8, discharging: true })
  expect(readFileMock).toHaveBeenCalledWith(
    '/sys/class/power_supply/BAT0/uevent',
    'utf8',
  )
})

test('can read battery info for a battery at a different path', async () => {
  const readFileMock = jest.spyOn(fs, 'readFile')

  // BAT0 does not exist
  readFileMock.mockRejectedValueOnce(new Error('ENOENT'))

  // BAT1 exists
  readFileMock.mockResolvedValueOnce(`
POWER_SUPPLY_ENERGY_NOW=800
POWER_SUPPLY_ENERGY_FULL=1000
POWER_SUPPLY_STATUS=Discharging
`)

  expect(await getBatteryInfo()).toEqual({ level: 0.8, discharging: true })
  expect(readFileMock).toHaveBeenNthCalledWith(
    1,
    '/sys/class/power_supply/BAT0/uevent',
    'utf8',
  )
  expect(readFileMock).toHaveBeenNthCalledWith(
    2,
    '/sys/class/power_supply/BAT1/uevent',
    'utf8',
  )
})

test('returns undefined if the power_supply "files" are not present', async () => {
  jest.spyOn(fs, 'readFile').mockRejectedValue(new Error('ENOENT'))
  expect(await getBatteryInfo()).toBeUndefined()
})

test('registers a handler to get battery info', async () => {
  jest.spyOn(fs, 'readFile').mockResolvedValue(`
POWER_SUPPLY_ENERGY_NOW=200
POWER_SUPPLY_ENERGY_FULL=1000
POWER_SUPPLY_STATUS=Discharging
`)

  const { ipcMain, ipcRenderer } = fakeIpc()

  register(ipcMain)

  expect(await ipcRenderer.invoke(getBatteryInfoChannel)).toEqual({
    level: 0.2,
    discharging: true,
  })
})
