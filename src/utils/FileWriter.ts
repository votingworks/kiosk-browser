import { Client as FileWriteClient, Write } from '../ipc/file-system-write-file'
import { Client as SaveAsClient, PromptToSaveOptions } from '../ipc/saveAs'

/**
 * Handles writing data to files.
 */
export interface FileWriter {
  write(data: Write['data']): Promise<void>
  end(): Promise<void>
}

/**
 * Create a file writer from the given file descriptor and client.
 */
export function create(fd: number, client = new FileWriteClient()): FileWriter {
  return {
    write: (data): Promise<void> => client.write(fd, data),
    end: (): Promise<void> => client.end(fd),
  }
}

/**
 * Opens a file with the given path and returns a writer for it.
 */
export async function fromPath(
  path: string,
  client = new FileWriteClient(),
): Promise<FileWriter> {
  const { fd } = await client.open(path)
  return create(fd, client)
}

/**
 * Prompts the user to choose a file path to write a file to.
 */
export async function fromPrompt(
  options?: PromptToSaveOptions,
  client = new SaveAsClient(),
): Promise<FileWriter | undefined> {
  const output = await client.promptToSave(options)

  if (output.type === 'cancel') {
    return
  }

  return create(output.fd, client)
}
