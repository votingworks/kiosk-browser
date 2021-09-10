import { fakeIpc } from '../../test/ipc'
import mockOf from '../../test/mockOf'
import exec from '../utils/exec'
import register, { channel as totpGetChannel } from './totp-get'

const execMock = mockOf(exec)
jest.mock('../utils/exec')

beforeEach(() => {
  execMock.mockReset()
  execMock.mockResolvedValue({ stdout: '', stderr: '' })
})

const { ipcMain, ipcRenderer } = fakeIpc()
register(ipcMain)

test('call to totp calls appropriate shell command and returns the right data', async () => {
  execMock.mockResolvedValueOnce({
    stdout: '2021-09-10 14:35:02: 932549',
    stderr: '',
  })

  const totpResult = await ipcRenderer.invoke(totpGetChannel)

  expect(execMock).toHaveBeenNthCalledWith(1, 'sudo', [
    '-n',
    '/usr/local/bin/tpm2-totp',
    'show',
  ])

  expect(totpResult).toEqual({
    // recomputing the ISO date here because not sure what timezone
    // this code is running in, so controlling for that here.
    isoDatetime: new Date('2021-09-10 14:35:02').toISOString(),
    code: '932549',
  })
})
