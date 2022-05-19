import { hasReadAccess, hasWriteAccess, OriginFilePermission } from './access';

test('no permissions', () => {
  const permissions: OriginFilePermission[] = [];
  expect(hasReadAccess(permissions, 'http://localhost:*')).toBe(false);
  expect(hasWriteAccess(permissions, 'http://localhost:*')).toBe(false);
});

test('read-only permissions', () => {
  const permissions: OriginFilePermission[] = [
    { origins: 'http://localhost:*', paths: '**/*', access: 'ro' },
  ];

  // matching origin
  expect(hasReadAccess(permissions, 'http://localhost:*')).toBe(true);
  expect(hasWriteAccess(permissions, 'http://localhost:*')).toBe(false);

  // mismatching origin
  expect(hasReadAccess(permissions, 'evil.com')).toBe(false);
  expect(hasWriteAccess(permissions, 'evil.com')).toBe(false);
});

test('write-only permissions', () => {
  const permissions: OriginFilePermission[] = [
    { origins: 'http://localhost:*', paths: '**/*', access: 'wo' },
  ];

  // matching origin
  expect(hasReadAccess(permissions, 'http://localhost:*')).toBe(false);
  expect(hasWriteAccess(permissions, 'http://localhost:*')).toBe(true);

  // mismatching origin
  expect(hasReadAccess(permissions, 'http://evil.com')).toBe(false);
  expect(hasWriteAccess(permissions, 'http://evil.com')).toBe(false);
});

test('read-write permissions', () => {
  const permissions: OriginFilePermission[] = [
    { origins: 'http://localhost:*', paths: '**/*', access: 'rw' },
  ];

  // matching origin
  expect(hasReadAccess(permissions, 'http://localhost:3000')).toBe(true);
  expect(hasWriteAccess(permissions, 'http://localhost:3000')).toBe(true);
  expect(hasReadAccess(permissions, 'http://localhost:3001')).toBe(true);
  expect(hasWriteAccess(permissions, 'http://localhost:3001')).toBe(true);

  // mismatching hostname
  expect(hasReadAccess(permissions, 'http://evil.com')).toBe(false);
  expect(hasWriteAccess(permissions, 'http://evil.com')).toBe(false);

  // mismatching scheme
  expect(hasReadAccess(permissions, 'https://localhost:3000')).toBe(false);
  expect(hasWriteAccess(permissions, 'https://localhost:3000')).toBe(false);
});

test('permission order', () => {
  const permissions: OriginFilePermission[] = [
    { origins: 'localhost', paths: '/media/**/*', access: 'ro' },
    { origins: 'localhost', paths: '/media/usb-stick/**/*', access: 'rw' },
  ];

  // Both permissions grant read access, so this is clear.
  expect(
    hasReadAccess(permissions, 'localhost', '/media/usb-stick/file.txt'),
  ).toBe(true);

  // This matches `/media/**/*` first, so it gets treated as read-only even
  // though `/media/usb-stick/**/*` would grant write access.
  expect(
    hasWriteAccess(permissions, 'localhost', '/media/usb-stick/file.txt'),
  ).toBe(false);

  // Flip the order, result is now what we'd "expect".
  expect(
    hasWriteAccess(
      [...permissions].reverse(),
      'localhost',
      '/media/usb-stick/file.txt',
    ),
  ).toBe(true);
});
