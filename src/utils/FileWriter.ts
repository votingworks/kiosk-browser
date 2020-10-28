import { Client as SaveAsClient, PromptToSaveOptions } from '../ipc/saveAs'
import { Client as FileWriteClient, Write } from '../ipc/file-system-write-file'

/**
 * Simple wrapper class to handle writing data to file from a save dialog.
 */
export default class FileWriter {
  public constructor(
    private fd: number,
    private client = new FileWriteClient(),
  ) {}

  /**
   * Write data to the file.
   */
  public async write(data: Write['data']): Promise<void> {
    return await this.client.write(this.fd, data)
  }

  /**
   * Ends writing and closes the file.
   */
  public async end(): Promise<void> {
    return await this.client.end(this.fd)
  }

  /**
   * Opens a file with the given path and returns a writer for it.
   */
  public static async fromPath(
    path: string,
    client = new FileWriteClient(),
  ): Promise<FileWriter> {
    const { fd } = await client.open(path)
    return new FileWriter(fd, client)
  }

  /**
   * Prompts the user to choose a file path to write a file to.
   */
  public static async fromPrompt(
    options?: PromptToSaveOptions,
    client = new SaveAsClient(),
  ): Promise<FileWriter | undefined> {
    const output = await client.promptToSave(options)

    if (output.type === 'cancel') {
      return
    }

    return new FileWriter(output.fd, client)
  }
}
