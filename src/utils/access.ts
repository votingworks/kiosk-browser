import multimatch from 'multimatch'

export type AccessType = 'ro' | 'wo' | 'rw'

export interface OriginFilePermission {
  readonly paths: string
  readonly origins: string
  readonly access: AccessType
}

/**
 * Determines whether an origin has one of the access types granted by a list of
 * permissions, optionally considering a specific path.
 */
export function hasAccess(
  permissions: readonly OriginFilePermission[],
  origin: string,
  path?: string,
  ...accesses: AccessType[]
): boolean {
  for (const { origins, paths, access } of permissions) {
    if (
      matchesPatterns(origin, origins) &&
      (!path || matchesPatterns(path, paths))
    ) {
      return accesses.includes(access)
    }
  }

  return false
}

/**
 * Determines whether an origin has read access granted by a list of
 * permissions, optionally considering a specific path.
 */
export function hasReadAccess(
  permissions: readonly OriginFilePermission[],
  origin: string,
  path?: string,
): boolean {
  return hasAccess(permissions, origin, path, 'ro', 'rw')
}

/**
 * Asserts that an origin has read access, optionally to a specific path.
 */
export function assertHasReadAccess(
  permissions: readonly OriginFilePermission[],
  origin: string,
  path?: string,
): void {
  if (!hasReadAccess(permissions, origin, path)) {
    throw new Error(`${origin} is not allowed to read ${path ?? 'anything'}`)
  }
}

/**
 * Determines whether an origin has write access granted by a list of
 * permissions, optionally considering a specific path.
 */
export function hasWriteAccess(
  permissions: readonly OriginFilePermission[],
  origin: string,
  path?: string,
): boolean {
  return hasAccess(permissions, origin, path, 'wo', 'rw')
}

/**
 * Asserts that an origin has write access, optionally to a specific path.
 */
export function assertHasWriteAccess(
  permissions: readonly OriginFilePermission[],
  origin: string,
  path?: string,
): void {
  if (!hasWriteAccess(permissions, origin, path)) {
    throw new Error(`${origin} is not allowed to write to ${path ?? 'disk'}`)
  }
}

function matchesPatterns(value: string, pattern: string): boolean {
  return multimatch(value, [pattern]).length > 0
}
