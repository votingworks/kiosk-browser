import { WriteStream, createWriteStream } from 'fs'

/**
 * Manages files opened on behalf of various origins.
 */
export default class OpenFiles {
  private nextFileDescriptorByOrigin = new Map<string, number>()
  private streamsByFileDescriptorByOrigin = new Map<
    string,
    Map<number, WriteStream>
  >()

  /**
   * Opens a file on behalf of `origin` at `filePath`.
   *
   * @returns a file descriptor to be given to `get` and `close`
   */
  public open(origin: string, filePath: string): number {
    const fd = this.nextFileDescriptorByOrigin.get(origin) ?? 1
    this.nextFileDescriptorByOrigin.set(origin, fd + 1)
    const stream = createWriteStream(filePath)
    let streamsByFileDescriptor = this.streamsByFileDescriptorByOrigin.get(
      origin,
    )
    if (!streamsByFileDescriptor) {
      streamsByFileDescriptor = new Map()
      this.streamsByFileDescriptorByOrigin.set(origin, streamsByFileDescriptor)
    }
    streamsByFileDescriptor.set(fd, stream)
    return fd
  }

  /**
   * Gets a stream for an already-opened file by origin and file descriptor.
   */
  public get(origin: string, fd: number): WriteStream | undefined {
    const streamsByFileDescriptor = this.streamsByFileDescriptorByOrigin.get(
      origin,
    )

    if (!streamsByFileDescriptor) {
      return
    }

    return streamsByFileDescriptor.get(fd)
  }

  /**
   * Closes a stream for an already-opened file, resolves when it's closed.
   */
  public async close(origin: string, fd: number): Promise<boolean> {
    const streamsByFileDescriptor = this.streamsByFileDescriptorByOrigin.get(
      origin,
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
