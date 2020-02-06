import register, { channel } from './quit'
import { IpcMain, app } from 'electron'

jest.mock('electron', () => ({
  app: {
    quit: jest.fn(),
  },
}))

test('quit', async () => {
  // Register our handler.
  const handle = jest.fn()
  register(({ handle } as unknown) as IpcMain)

  // Things should be registered as expected.
  expect(handle).toHaveBeenCalledWith(channel, expect.any(Function))

  // Is the handler wired up right?
  const [, handler] = handle.mock.calls[0]
  await handler()
  expect(app.quit).toHaveBeenCalledTimes(1)
})
