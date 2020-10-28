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

function matchesPatterns(value: string, pattern: string): boolean {
  return multimatch(value, [pattern]).length > 0
}
