export interface ImmutableSet<T> extends Iterable<T> {
  add(value: T): ImmutableSet<T>
  delete(value: T): ImmutableSet<T>
}

/**
 * Implements an immutable `Set` using a custom key to check equality. The
 * built-in `Set` uses identity to determine whether a value is contained by a
 * set. Use this class when you want to use something else to determine whether
 * a value is contained by the set. For example, using a unique property of an
 * object rather than the whole object.
 *
 * @example
 *
 * ```ts
 * const set = new Set()
 * let keySet = new KeySet((user: User) => user.id)
 *
 * const root = { id: 0, name: 'root' } as const
 * set.add(root)
 * keySet = keySet.add(root)
 *
 * // both work with identity
 * set.has(root)           // true
 * keySet.has(root)        // true
 *
 * // but not equivalence
 * set.has({ ...root })    // false
 * keySet.has({ ...root }) // true
 * ```
 */
export default class KeySet<T, K> implements ImmutableSet<T> {
  private keyFn: (value: T) => K
  private map = new Map<K, T>()

  /**
   * @param keyFn Maps a value to a key, where two values with the same key are
   *              considered to be equivalent.
   */
  public constructor(keyFn: (value: T) => K, values: Iterable<T> = []) {
    this.keyFn = keyFn

    for (const value of values) {
      this.map.set(keyFn(value), value)
    }
  }

  /**
   * Determines whether this set has a given value based on key equivalence.
   */
  public has(value: T): boolean {
    return this.map.has(this.keyFn(value))
  }

  /**
   * Builds a new set that includes a new value.
   */
  public add(value: T): KeySet<T, K> {
    return new KeySet(this.keyFn, [...this.values(), value])
  }

  /**
   * Deletes a value from the set based on key equivalence.
   */
  public delete(value: T): KeySet<T, K> {
    const key = this.keyFn(value)
    return new KeySet(
      this.keyFn,
      [...this.values()].filter(value => this.keyFn(value) !== key),
    )
  }

  /**
   * Clears all values in the set.
   */
  public clear(): KeySet<T, K> {
    return new KeySet<T, K>(this.keyFn)
  }

  /**
   * Iterates over all values in the set in insertion order.
   */
  public forEach(
    callbackfn: (value: T, value2: T, set: KeySet<T, K>) => void,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    thisArg?: any,
  ): void {
    this.map.forEach(value => {
      callbackfn(value, value, this)
    }, thisArg)
  }

  /**
   * Gets the number of values in the set.
   */
  public get size(): number {
    return this.map.size
  }

  /**
   * Gets an iterator for all values in the set.
   */
  public [Symbol.iterator](): IterableIterator<T> {
    return this.map.values()
  }

  /**
   * Gets an iterator for all keys and values in the set. Since this is a set
   * and not a map, keys and values are the same.
   */
  public entries(): IterableIterator<[T, T]> {
    return new Set<T>(this.map.values()).entries()
  }

  /**
   * Gets an iterator for all keys in the set. Since this is a set and not a
   * map, keys and values are the same.
   */
  public keys(): IterableIterator<T> {
    return this.map.values()
  }

  /**
   * Gets an iterator for all values in the set.
   */
  public values(): IterableIterator<T> {
    return this.map.values()
  }

  /**
   * Gets a string value used to construct a description of the set.
   */
  public get [Symbol.toStringTag](): string {
    return Set.prototype[Symbol.toStringTag]
  }
}
