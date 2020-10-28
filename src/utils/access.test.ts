import { hasReadAccess, hasWriteAccess, HostFilePermission } from './access'

test('no permissions', () => {
  const permissions: HostFilePermission[] = []
  expect(hasReadAccess(permissions, 'localhost')).toBe(false)
  expect(hasWriteAccess(permissions, 'localhost')).toBe(false)
})

test('read-only permissions', () => {
  const permissions: HostFilePermission[] = [
    { hostnames: 'localhost', paths: '**/*', access: 'ro' },
  ]

  // matching hostname
  expect(hasReadAccess(permissions, 'localhost')).toBe(true)
  expect(hasWriteAccess(permissions, 'localhost')).toBe(false)

  // mismatching hostname
  expect(hasReadAccess(permissions, 'evil.com')).toBe(false)
  expect(hasWriteAccess(permissions, 'evil.com')).toBe(false)
})

test('write-only permissions', () => {
  const permissions: HostFilePermission[] = [
    { hostnames: 'localhost', paths: '**/*', access: 'wo' },
  ]

  // matching hostname
  expect(hasReadAccess(permissions, 'localhost')).toBe(false)
  expect(hasWriteAccess(permissions, 'localhost')).toBe(true)

  // mismatching hostname
  expect(hasReadAccess(permissions, 'evil.com')).toBe(false)
  expect(hasWriteAccess(permissions, 'evil.com')).toBe(false)
})

test('read-write permissions', () => {
  const permissions: HostFilePermission[] = [
    { hostnames: 'localhost', paths: '**/*', access: 'rw' },
  ]

  // matching hostname
  expect(hasReadAccess(permissions, 'localhost')).toBe(true)
  expect(hasWriteAccess(permissions, 'localhost')).toBe(true)

  // mismatching hostname
  expect(hasReadAccess(permissions, 'evil.com')).toBe(false)
  expect(hasWriteAccess(permissions, 'evil.com')).toBe(false)
})

test('permission order', () => {
  const permissions: HostFilePermission[] = [
    { hostnames: 'localhost', paths: '/media/**/*', access: 'ro' },
    { hostnames: 'localhost', paths: '/media/usb-stick/**/*', access: 'rw' },
  ]

  // Both permissions grant read access, so this is clear.
  expect(
    hasReadAccess(permissions, 'localhost', '/media/usb-stick/file.txt'),
  ).toBe(true)

  // This matches `/media/**/*` first, so it gets treated as read-only even
  // though `/media/usb-stick/**/*` would grant write access.
  expect(
    hasWriteAccess(permissions, 'localhost', '/media/usb-stick/file.txt'),
  ).toBe(false)

  // Flip the order, result is now what we'd "expect".
  expect(
    hasWriteAccess(
      [...permissions].reverse(),
      'localhost',
      '/media/usb-stick/file.txt',
    ),
  ).toBe(true)
})
