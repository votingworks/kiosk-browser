export function ok<T>(
  condition: T,
  message = `expected condition to be truthy but got: ${condition}`,
): asserts condition {
  if (!condition) {
    throw new Error(message)
  }
}

export function defined<T>(
  value: T | undefined,
  message = `expected value to be defined but got: ${value}`,
): asserts value is T {
  ok(typeof value !== 'undefined', message)
}

export function notDefined<T>(
  value: T | undefined,
  message = `expected value not to be defined but got: ${value}`,
): asserts value is undefined {
  ok(typeof value === 'undefined', message)
}
