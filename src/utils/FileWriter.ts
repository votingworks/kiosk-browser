import { Client as FileWriteClient, Write } from '../ipc/file-system-write-file'
import { Client as SaveAsClient, PromptToSaveOptions } from '../ipc/saveAs'
import path from 'path'

/**
 * Handles writing data to files.
 */
export interface FileWriter {
  write(data: Write['data']): Promise<void>
  end(): Promise<void>
  filename: string
}

/**
 * Create a file writer from the given file descriptor and client.
 */
export function create(
  fd: string,
  filename: string,
  client = new FileWriteClient(),
): FileWriter {
  return {
    write: (data): Promise<void> => client.write(fd, data),
    end: (): Promise<void> => client.end(fd),
    filename: filename,
  }
}

/**
 * Opens a file with the given path and returns a writer for it.
 */
export async function fromPath(
  filePath: string,
  client = new FileWriteClient(),
): Promise<FileWriter> {
  const filename = path.parse(filePath).base
  const { fd } = await client.open(filePath)
  return create(fd, filename, client)
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

  return create(output.fd, output.name, client)
}
