import { WriteStream, createWriteStream } from 'fs'

/**
 * Manages files opened on behalf of various hosts.
 */
export default class OpenFiles {
  private nextFileDescriptorByHostname = new Map<string, number>()
  private streamsByFileDescriptorByHostname = new Map<
    string,
    Map<number, WriteStream>
  >()

  /**
   * Opens a file on behalf of `hostname` at `filePath`.
   *
   * @returns a file descriptor to be given to `get` and `close`
   */
  public open(hostname: string, filePath: string): number {
    const fd = this.nextFileDescriptorByHostname.get(hostname) ?? 1
    this.nextFileDescriptorByHostname.set(hostname, fd + 1)
    const stream = createWriteStream(filePath)
    let streamsByFileDescriptor = this.streamsByFileDescriptorByHostname.get(
      hostname,
    )
    if (!streamsByFileDescriptor) {
      streamsByFileDescriptor = new Map()
      this.streamsByFileDescriptorByHostname.set(
        hostname,
        streamsByFileDescriptor,
      )
    }
    streamsByFileDescriptor.set(fd, stream)
    return fd
  }

  /**
   * Gets a stream for an already-opened file by hostname and file descriptor.
   */
  public get(hostname: string, fd: number): WriteStream | undefined {
    const streamsByFileDescriptor = this.streamsByFileDescriptorByHostname.get(
      hostname,
    )

    if (!streamsByFileDescriptor) {
      return
    }

    return streamsByFileDescriptor.get(fd)
  }

  /**
   * Closes a stream for an already-opened file, resolves when it's closed.
   */
  public async close(hostname: string, fd: number): Promise<boolean> {
    const streamsByFileDescriptor = this.streamsByFileDescriptorByHostname.get(
      hostname,
    )

    if (!streamsByFileDescriptor) {
      return false
    }

    const stream = streamsByFileDescriptor.get(fd)

    if (!stream) {
      return false
    }

    streamsByFileDescriptor.delete(fd)
    return new Promise(resolve => stream.end(resolve))
  }
}
