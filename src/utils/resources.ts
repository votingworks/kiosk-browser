/**
 * Represents a retain of a resource.
 */
export class Retain {
  public constructor(private resource: Resource) {}

  /**
   * Releases this retain.
   */
  public release(): void {
    this.resource.release(this)
  }
}

/**
 * Represents a shared resource that consumers can retain an interest in.
 */
export class Resource {
  private retains = new Set<Retain>()

  /**
   * Retains a resource until its value is released.
   */
  public retain(): Retain {
    const retention = new Retain(this)
    this.retains.add(retention)
    return retention
  }

  /**
   * Releases a previously retained value.
   */
  public release(retain: Retain): void {
    const hadRetain = this.retains.delete(retain)

    if (!hadRetain) {
      throw new Error(
        'given retain is not associated with this resource or has already been released',
      )
    }
  }

  /**
   * Releases all retains held by this resource.
   */
  public releaseAll(): void {
    this.retains.clear()
  }

  /**
   * Determines whether this resource has any outstanding retains.
   */
  public isRetained(): boolean {
    return this.retains.size > 0
  }
}
