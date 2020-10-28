import { Client, PromptToSaveOptions, Write } from '../ipc/saveAs'

/**
 * Simple wrapper class to handle writing data to file from a save dialog.
 */
export default class FileWriter {
  public constructor(private fd: number, private client = new Client()) {}

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
   * Prompts the user to choose a file path to write a file to.
   */
  public static async fromPrompt(
    options?: PromptToSaveOptions,
    client = new Client(),
  ): Promise<FileWriter | undefined> {
    const output = await client.promptToSave(options)

    if (output.type === 'cancel') {
      return
    }

    return new FileWriter(output.fd, client)
  }
}
