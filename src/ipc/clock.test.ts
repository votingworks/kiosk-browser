import { promisify } from 'util'
import { fakeIpc } from '../../test/ipc'
import exec from '../utils/exec'
import mockOf from '../../test/mockOf'
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
    'set-time',
    '2020-10-03 10:00:00',
  ])

  expect(execMock).toHaveBeenNthCalledWith(2, 'sudo', [
    '-n',
    '/usr/bin/timedatectl',
    'set-timezone',
    'America/Chicago',
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
    'set-time',
    '2020-11-03 09:00:00',
  ])

  expect(execMock).toHaveBeenNthCalledWith(2, 'sudo', [
    '-n',
    '/usr/bin/timedatectl',
    'set-timezone',
    'America/Chicago',
  ])
})
