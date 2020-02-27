import exec, { makeExecError } from '../exec'
import mockOf from '../../../test/mockOf'
import getPrinterDeviceURI from './getPrinterDeviceURI'

jest.mock('../exec')

const execMock = mockOf(exec)

test('missing printer', async () => {
  execMock.mockRejectedValueOnce(
    makeExecError({
      cmd: 'lpstat -v missing-printer',
      stderr: 'lpstat: Invalid destination name in list "missing-printer".',
    }),
  )

  expect(await getPrinterDeviceURI('missing-printer')).toBeUndefined()
  expect(execMock).toHaveBeenCalledWith('lpstat', ['-v', 'missing-printer'])
})

test('printer configured with valid destination', async () => {
  execMock.mockResolvedValueOnce({
    stdout: 'device for valid-printer: usb://HP/Something\n',
    stderr: '',
  })

  expect(await getPrinterDeviceURI('valid-printer')).toEqual(
    'usb://HP/Something',
  )
  expect(execMock).toHaveBeenCalledWith('lpstat', ['-v', 'valid-printer'])
})

test('different printer returned from `lpstat`', async () => {
  execMock.mockResolvedValueOnce({
    stdout: 'device for another-printer: usb://HP/Something\n',
    stderr: '',
  })

  await expect(getPrinterDeviceURI('a-printer')).rejects.toThrowError(
    'lpstat returned a different printer than requested: another-printer != a-printer',
  )
  expect(execMock).toHaveBeenCalledWith('lpstat', ['-v', 'a-printer'])
})

test('`lpstat` gibberish', async () => {
  execMock.mockResolvedValueOnce({
    stdout: 'abba gazabba',
    stderr: '',
  })

  expect(await getPrinterDeviceURI('a-printer')).toBeUndefined()
})
