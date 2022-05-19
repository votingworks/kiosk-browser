import KeySet from './KeySet';

interface User {
  id: number;
  name: string;
}

test('empty set', () => {
  const set = new KeySet((v) => v);

  expect(set.size).toEqual(0);
  expect(Array.from(set)).toEqual([]);
  expect(Array.from(set.keys())).toEqual([]);
  expect(Array.from(set.values())).toEqual([]);
  expect(Array.from(set.entries())).toEqual([]);
});

test('value identity', () => {
  const set = new KeySet((v) => v);

  expect(set.add(1)).toEqual(new KeySet((v) => v, [1]));
  expect(set.add(1).delete(1)).toEqual(set);
});

test('simple key function', () => {
  const empty = new KeySet((user: User) => user.id);
  const withRoot = empty.add({ id: 0, name: 'root' });

  expect(withRoot.size).toBe(1);

  const withRootAgain = withRoot.add({ id: 0, name: 'root' });
  expect(withRootAgain.size).toBe(1);

  const withoutRoot = withRootAgain.delete({ id: 0, name: 'ROOT' });
  expect(withoutRoot.size).toBe(0);
});

test('looping', () => {
  // Key is string length, so all equally long strings are considered the same.
  const empty = new KeySet((s: string) => s.length);

  // Add strings of different lengths.
  const withStrings = empty.add('cat').add('truck').add('barn');

  // Loop using Symbol.iterator.
  expect(Array.from(withStrings)).toEqual(['cat', 'truck', 'barn']);

  // Loop using forEach.
  const callback = jest.fn();
  withStrings.forEach(callback);

  expect(callback).toHaveBeenCalledTimes(3);
  expect(callback).toHaveBeenNthCalledWith(1, 'cat', 'cat', withStrings);
  expect(callback).toHaveBeenNthCalledWith(2, 'truck', 'truck', withStrings);
  expect(callback).toHaveBeenNthCalledWith(3, 'barn', 'barn', withStrings);
});

test('collisions', () => {
  // Key is string length, so all equally long strings are considered the same.
  const empty = new KeySet((s: string) => s.length);

  // Expect a collision with `has`.
  const withCat = empty.add('cat');
  expect(withCat.has('cat')).toBe(true);
  expect(withCat.has('dog')).toBe(true);

  // Collisions on add clobber existing values.
  const withRat = withCat.add('rat');
  expect(Array.from(withRat)).toEqual(['rat']);
});

test('clearing', () => {
  expect(Array.from(new KeySet((v) => v).add(1).clear())).toEqual([]);
});
