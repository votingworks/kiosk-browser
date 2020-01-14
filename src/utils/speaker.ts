import { execFile } from 'child_process'
import { promisify } from 'util'

const exec = promisify(execFile)

export interface SpeakCommand {
  type: 'speak'
  text: string
  voice?: string
}

export interface CancelCommand {
  type: 'cancel'
}

export interface GetVoicesCommand {
  type: 'getVoices'
}

export type Command = SpeakCommand | CancelCommand | GetVoicesCommand

export type CommandCallback = (
  error: Error | null,
  stdout: string,
  stderr: string,
) => void

export type CommandWithCallback = [Command, CommandCallback]

export default class Speaker {
  public async speak(text: string, voice?: string): Promise<void> {
    await this.run({ type: 'speak', text, voice })
  }

  public async cancel(): Promise<void> {
    await this.run({ type: 'cancel' })
  }

  public async getVoices(): Promise<SpeechSynthesisVoice[]> {
    const { stdout } = await this.run({ type: 'getVoices' })
    const [header, ...entries] = stdout.split('\n')
    const columns = header.trim().split(/\s+/)
    const records = entries.map(entry => entry.trim().split(/\s+/))
    const nameColumn = columns.findIndex(column => column === 'NAME')
    const languageColumn = columns.findIndex(column => column === 'LANGUAGE')
    const variantColumn = columns.findIndex(column => column === 'VARIANT')

    return records
      .filter(record => record.length === columns.length)
      .map(record => {
        const name = record[nameColumn]
        const language = record[languageColumn]
        const variant = record[variantColumn]

        return {
          default: false,
          lang:
            !language || language === 'none'
              ? ''
              : !variant || variant === 'none'
              ? language
              : `${language}-${variant}`,
          localService: true,
          name,
          voiceURI: name,
        }
      })
  }

  private async run(
    command: Command,
  ): Promise<{ stdout: string; stderr: string }> {
    const args = ['--application-name', 'kiosk-browser']

    if (command.type === 'speak') {
      args.push('--wait', command.text)
      if (command.voice) {
        args.push('--synthesis-voice', command.voice)
      }
    } else if (command.type === 'cancel') {
      args.push('--cancel')
    } else if (command.type === 'getVoices') {
      args.push('--list-synthesis-voices')
    }

    return await exec('spd-say', args)
  }
}
