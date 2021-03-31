import { fakeIpc } from '../../test/ipc'
import mockOf from '../../test/mockOf'
import exec from '../utils/exec'
import register, { channel as setClockChannel } from './clock'

const execMock = mockOf(exec)
jest.mock('../utils/exec')

beforeEach(() => {
  execMock.mockReset()
  execMock.mockResolvedValue({ stdout: '', stderr: '' })
})

const { ipcMain, ipcRenderer } = fakeIpc()
register(ipcMain)

test('set datetime works in daylights savings', async () => {
  await ipcRenderer.invoke(setClockChannel, {
    isoDatetime: '2020-10-03T15:00Z',
    IANAZone: 'America/Chicago',
  })

  expect(execMock).toHaveBeenNthCalledWith(1, 'sudo', [
    '-n',
    '/usr/bin/timedatectl',
    'set-timezone',
    'America/Chicago',
  ])

  expect(execMock).toHaveBeenNthCalledWith(2, 'sudo', [
    '-n',
    '/usr/bin/timedatectl',
    'set-time',
    '2020-10-03 10:00:00',
  ])
})

test('set datetime works in non- daylights savings', async () => {
  await ipcRenderer.invoke(setClockChannel, {
    isoDatetime: '2020-11-03T15:00Z',
    IANAZone: 'America/Chicago',
  })

  expect(execMock).toHaveBeenNthCalledWith(1, 'sudo', [
    '-n',
    '/usr/bin/timedatectl',
    'set-timezone',
    'America/Chicago',
  ])

  expect(execMock).toHaveBeenNthCalledWith(2, 'sudo', [
    '-n',
    '/usr/bin/timedatectl',
    'set-time',
    '2020-11-03 09:00:00',
  ])
})

test('set datetime fails when NTP is enabled', async () => {
  execMock.mockRejectedValueOnce(
    new Error('Failed to set time: Automatic time synchronization is enabled'),
  )

  await expect(
    ipcRenderer.invoke(setClockChannel, {
      isoDatetime: '2020-11-03T15:00Z',
      IANAZone: 'America/Chicago',
    }),
  ).rejects.toThrowError(
    'Failed to set time: Automatic time synchronization is enabled',
  )
})
