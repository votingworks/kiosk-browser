const values = new Map<string, unknown>()

function get<T>(
  key: string,
  callback: (error: Error | null, value: T | undefined) => void,
): void {
  callback(null, values.get(key) as T | undefined)
}

function has(
  key: string,
  callback: (error: Error | null, value: boolean) => void,
): void {
  callback(null, values.has(key))
}

function set<T>(
  key: string,
  value: T,
  callback: (error: Error | null) => void,
): void {
  values.set(key, value)
  callback(null)
}

function remove(key: string, callback: (error: Error | null) => void): void {
  values.delete(key)
  callback(null)
}

function clear(callback: (error: Error | null) => void): void {
  values.clear()
  callback(null)
}

beforeEach(done => {
  clear(done)
})

export default {
  get: jest.fn(get),
  has: jest.fn(has),
  set: jest.fn(set),
  remove: jest.fn(remove),
  clear: jest.fn(clear),
}
