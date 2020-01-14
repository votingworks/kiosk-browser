import { IpcMain, IpcMainInvokeEvent } from 'electron'
import Speaker, { Command } from '../utils/speaker'
import { inspect } from 'util'

export const channel = 'tts'

export interface SpeakOptions {
  now?: boolean
  voice?: SpeechSynthesisVoice
}

export function assertSpeakOptions(
  options: unknown,
): asserts options is SpeakOptions {
  if (options === null || typeof options !== 'object') {
    throw new Error(`expected SpeakOptions but got: ${inspect(options)}`)
  }
}

export async function speak(
  speaker: Speaker,
  ...args: unknown[]
): Promise<void> {
  const text = args[0] ?? ''
  const options = args[1] ?? {}

  if (typeof text !== 'string') {
    throw new Error(`${channel}: 'text' must be a string`)
  }

  assertSpeakOptions(options)

  if (options.now) {
    await speaker.cancel()
  }

  await speaker.speak(text)
}

export async function cancel(speaker: Speaker): Promise<void> {
  await speaker.cancel()
}

export async function getVoices(
  speaker: Speaker,
): Promise<SpeechSynthesisVoice[]> {
  return await speaker.getVoices()
}

export default function register(
  ipcMain: IpcMain,
  speaker = new Speaker(),
): void {
  ipcMain.handle(
    channel,
    async (
      event: IpcMainInvokeEvent,
      command: Command['type'],
      ...args: unknown[]
    ) => {
      switch (command) {
        case 'speak':
          return await speak(speaker, ...args)

        case 'cancel':
          return await cancel(speaker)

        case 'getVoices':
          return await getVoices(speaker)

        default:
          throw new Error(`unknown speaker command: ${command}`)
      }
    },
  )
}
