import { v4 as uuid } from 'uuid'
import { fakeIpc } from '../../test/ipc'
import { Client } from '../ipc/saveAs'
import { create, fromPrompt } from './FileWriter'

function fakeClient(): jest.Mocked<Client> {
  const { ipcRenderer } = fakeIpc()
  const client = new Client(ipcRenderer)

  jest.spyOn(client, 'promptToSave').mockResolvedValue({ type: 'cancel' })
  jest.spyOn(client, 'write').mockResolvedValue(undefined)
  jest.spyOn(client, 'end').mockResolvedValue(undefined)

  return client as jest.Mocked<Client>
}

test('creating from prompt fails', async () => {
  const client = fakeClient()
  client.promptToSave.mockResolvedValueOnce({ type: 'cancel' })
  expect(await fromPrompt({}, client)).toEqual(undefined)
})

test('creating from prompt succeeds', async () => {
  const client = fakeClient()
  client.promptToSave.mockResolvedValueOnce({ type: 'file', fd: uuid() })
  expect(await fromPrompt({}, client)).toEqual({
    write: expect.any(Function),
    end: expect.any(Function),
  })
})

test('write passes the file descriptor and data', async () => {
  const fd = uuid()
  const client = fakeClient()
  const writer = create(fd, client)
  await writer.write('abcdefg')
  expect(client.write).toHaveBeenCalledWith(fd, 'abcdefg')
})

test('end passes the file descriptor', async () => {
  const fd = uuid()
  const client = fakeClient()
  const writer = create(fd, client)
  await writer.end()
  expect(client.end).toHaveBeenCalledWith(fd)
})
