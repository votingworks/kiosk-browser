export type DeepReadonly<T> = T extends object
  ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
  : T extends Array<infer U>
  ? ReadonlyArray<DeepReadonly<U>>
  : Readonly<T>

export default function readonly<T>(value: T): DeepReadonly<T> {
  return value as DeepReadonly<T>
}
