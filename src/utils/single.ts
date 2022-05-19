export default function single<T>(singleElementArray: T[]): T {
  if (singleElementArray.length !== 1) {
    throw new TypeError(
      `expected an array with a single element, but got ${singleElementArray.length}`,
    );
  }

  return singleElementArray[0];
}
