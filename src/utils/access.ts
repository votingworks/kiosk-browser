import multimatch from 'multimatch'

export type AccessType = 'ro' | 'wo' | 'rw'

export interface HostFilePermission {
  readonly paths: string
  readonly hostnames: string
  readonly access: AccessType
}

/**
 * Determines whether a host has one of the access types granted by a list of
 * permissions, optionally considering a specific path.
 */
export function hasAccess(
  permissions: readonly HostFilePermission[],
  hostname: string,
  path?: string,
  ...accesses: AccessType[]
): boolean {
  for (const { hostnames, paths, access } of permissions) {
    if (
      matchesPatterns(hostname, hostnames) &&
      (!path || matchesPatterns(path, paths))
    ) {
      return accesses.includes(access)
    }
  }

  return false
}

/**
 * Determines whether a host read access granted by a list of permissions,
 * optionally considering a specific path.
 */
export function hasReadAccess(
  permissions: readonly HostFilePermission[],
  hostname: string,
  path?: string,
): boolean {
  return hasAccess(permissions, hostname, path, 'ro', 'rw')
}

/**
 * Asserts that a host has read access, optionally to a specific path.
 */
export function assertHasReadAccess(
  permissions: readonly HostFilePermission[],
  hostname: string,
  path?: string,
): void {
  if (!hasReadAccess(permissions, hostname, path)) {
    throw new Error(`${hostname} is not allowed to read ${path ?? 'anything'}`)
  }
}

/**
 * Determines whether a host write access granted by a list of permissions,
 * optionally considering a specific path.
 */
export function hasWriteAccess(
  permissions: readonly HostFilePermission[],
  hostname: string,
  path?: string,
): boolean {
  return hasAccess(permissions, hostname, path, 'wo', 'rw')
}

/**
 * Asserts that a host has write access, optionally to a specific path.
 */
export function assertHasWriteAccess(
  permissions: readonly HostFilePermission[],
  hostname: string,
  path?: string,
): void {
  if (!hasWriteAccess(permissions, hostname, path)) {
    throw new Error(`${hostname} is not allowed to write to ${path ?? 'disk'}`)
  }
}

function matchesPatterns(value: string, pattern: string): boolean {
  return multimatch(value, [pattern]).length > 0
}
