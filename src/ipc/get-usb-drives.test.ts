import register, { channel } from './get-usb-drives'
import { IpcMain, app } from 'electron'
import exec from '../utils/exec'
import mockOf from '../../test/mockOf'

const execMock = mockOf(exec)

jest.mock('../utils/exec')

test('get-usb-drives', async () => {
  // Register our handler.
  const handle = jest.fn()
  register(({ handle } as unknown) as IpcMain)

  // Things should be registered as expected.
  expect(handle).toHaveBeenCalledWith(channel, expect.any(Function))

  execMock.mockResolvedValueOnce({
    stdout: 'usb-foobar-part23\nnotausb-bazbar-part21\nusb-babar-part3\n',
    stderr: '',
  })
  execMock.mockResolvedValueOnce({
    stdout: 'sdb1',
    stderr: '',
  })
  execMock.mockResolvedValueOnce({
    stdout: 'sdc1',
    stderr: '',
  })
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
          mountpoint: '/media/usb-sdb1',
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

  // Is the handler wired up right?
  const [, handler] = handle.mock.calls[0]
  const devices = await handler()

  expect(devices).toEqual([
    { deviceName: 'sdb1', mountPoint: '/media/usb-sdb1' },
    { deviceName: 'sdc1', mountPoint: null },
  ])
})
