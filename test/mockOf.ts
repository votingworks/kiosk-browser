export default function mockOf<T>(
  value: T,
): T extends (...args: any[]) => any ? jest.MockedFunction<T> : jest.Mocked<T> {
  return value as any
}
