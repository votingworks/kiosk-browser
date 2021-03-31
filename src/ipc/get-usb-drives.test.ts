import { IpcMain } from 'electron'
import { promises as fs } from 'fs'
import mockOf from '../../test/mockOf'
import exec from '../utils/exec'
import register, { channel } from './get-usb-drives'

const execMock = mockOf(exec)
const readdirMock = (fs.readdir as unknown) as jest.Mock<Promise<string[]>>
const readlinkMock = (fs.readlink as unknown) as jest.Mock<Promise<string>>

jest.mock('fs', () => ({
  promises: {
    readdir: jest.fn(),
    readlink: jest.fn(),
  },
}))
jest.mock('../utils/exec')

test('get-usb-drives', async () => {
  // Register our handler.
  const handle = jest.fn()
  register(({ handle } as unknown) as IpcMain)

  // Things should be registered as expected.
  expect(handle).toHaveBeenCalledWith(channel, expect.any(Function))

  readdirMock.mockResolvedValueOnce([
    'usb-foobar-part23',
    'notausb-bazbar-part21',
    'usb-babar-part3',
  ])
  readlinkMock.mockResolvedValueOnce('../../sdb1')
  readlinkMock.mockResolvedValueOnce('../../sdc1')
  execMock.mockResolvedValueOnce({
    stdout: JSON.stringify({
      blockdevices: [
        {
          name: 'sdb1',
          'maj:min': '8:3',
          rm: '0',
          size: '93.9M',
          ro: '1',
          type: 'part',
          mountpoint: '/media/usb-drive-sdb1',
        },
      ],
    }),
    stderr: '',
  })
  execMock.mockResolvedValueOnce({
    stdout: JSON.stringify({
      blockdevices: [
        {
          name: 'sdc1',
          'maj:min': '8:3',
          rm: '0',
          size: '73.2M',
          ro: '1',
          type: 'part',
          mountpoint: null,
        },
      ],
    }),
    stderr: '',
  })

  execMock.mockResolvedValueOnce({
    stdout: JSON.stringify({
      filesystems: [
        {
          target: '/media/usb-drive-sdb1',
          source: '/dev/sdb1',
        },
        {
          target: '/media/usb-drive-sdz1',
          source: '/dev/sdz1',
        },
        {
          target: 'something',
          source: 'random',
        },
      ],
    }),
    stderr: '',
  })

  // Is the handler wired up right?
  const [, handler] = handle.mock.calls[0]
  const devices = await handler()

  expect(execMock).toHaveBeenCalledTimes(4)
  expect(execMock).toHaveBeenNthCalledWith(4, 'pumount', [
    '/media/usb-drive-sdz1',
  ])
  expect(devices).toEqual([
    { deviceName: 'sdb1', mountPoint: '/media/usb-drive-sdb1' },
    { deviceName: 'sdc1' },
  ])
})

test('get-usb-drives works when findmnt returns nothing', async () => {
  // Register our handler.
  const handle = jest.fn()
  register(({ handle } as unknown) as IpcMain)

  // Things should be registered as expected.
  expect(handle).toHaveBeenCalledWith(channel, expect.any(Function))

  readdirMock.mockResolvedValueOnce(['usb-foobar-part23'])
  readlinkMock.mockResolvedValueOnce('../../sdb1')
  execMock.mockResolvedValueOnce({
    stdout: JSON.stringify({
      blockdevices: [
        {
          name: 'sdb1',
          'maj:min': '8:3',
          rm: '0',
          size: '93.9M',
          ro: '1',
          type: 'part',
          mountpoint: '/media/usb-drive-sdb1',
        },
      ],
    }),
    stderr: '',
  })

  execMock.mockResolvedValueOnce({
    stdout: '',
    stderr: '',
  })

  // Is the handler wired up right?
  const [, handler] = handle.mock.calls[0]
  const devices = await handler()

  expect(execMock).toHaveBeenCalledTimes(2)
  expect(execMock).toHaveBeenCalledWith('findmnt', ['-J', '-t', 'vfat'])
  expect(devices).toEqual([
    { deviceName: 'sdb1', mountPoint: '/media/usb-drive-sdb1' },
  ])
})
