import { Resource } from './resources'

test('resources are not retained by default', () => {
  expect(new Resource().isRetained()).toBe(false)
})

test('resources are retained once retain is called', () => {
  const resource = new Resource()
  resource.retain()
  expect(resource.isRetained()).toBe(true)
})

test('retained resources can be individually released', () => {
  const resource = new Resource()
  resource.retain().release()
  expect(resource.isRetained()).toBe(false)
})

test('retained resources can be released all at once', () => {
  const resource = new Resource()
  resource.retain()
  resource.retain()
  resource.retain()
  resource.releaseAll()
  expect(resource.isRetained()).toBe(false)
})

test('retains cannot be released multiple times', () => {
  const resource = new Resource()
  const retain = resource.retain()

  // once works
  retain.release()
  // twice doesn't
  expect(() => retain.release()).toThrowError(/already been released/)
})
