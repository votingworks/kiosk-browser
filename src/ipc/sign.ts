import makeDebug from 'debug'
import { IpcMain, IpcMainInvokeEvent } from 'electron'
import { RegisterIpcHandler } from '..'
import exec from '../utils/exec'

export const channel = 'sign'

const debug = makeDebug('kiosk-browser:sign')

export interface SignParams {
  signatureType: string
  payload: string
}

async function sign(
  { signatureType, payload }: SignParams,
  signifySecretKey?: string,
): Promise<string | undefined> {
  if (!signifySecretKey) {
    debug('could not sign because no secret key')
    return
  }

  if (signatureType.includes('.')) {
    debug('signature type cannot contain a period, which is our delimiter')
    return
  }

  const rawPayloadToSign = `${signatureType}.${payload}`

  try {
    const { stdout, stderr } = await exec(
      'signify-openbsd',
      ['-S', '-s', signifySecretKey, '-m', '-', '-x', '-'],
      rawPayloadToSign,
    )

    if (stderr) {
      debug('error trying to sign %s', stderr)
      return
    }

    // the first line is a comment, the second is the signature
    return stdout.split('\n')[1]
  } catch (err) {
    debug('could not call signify-openbsd: %s', err)
    return
  }
}

const register: RegisterIpcHandler = (ipcMain: IpcMain, { options }): void => {
  ipcMain.handle(
    channel,
    async (event: IpcMainInvokeEvent, params: SignParams) => {
      return await sign(params, options.signifySecretKey)
    },
  )
}

export default register
