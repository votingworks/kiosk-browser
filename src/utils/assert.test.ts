import { ok, defined, notDefined } from './assert';

test('ok', () => {
  expect(() => ok(true)).not.toThrow();
  expect(() => ok(false)).toThrowError(
    'expected condition to be truthy but got: false',
  );
  expect(() => ok(false, 'WAT')).toThrowError('WAT');
});

test('defined', () => {
  expect(() => defined(1)).not.toThrow();
  expect(() => defined(undefined)).toThrowError(
    'expected value to be defined but got: undefined',
  );
  expect(() => defined(undefined, 'DEF')).toThrowError('DEF');
});

test('notDefined', () => {
  expect(() => notDefined(undefined)).not.toThrow();
  expect(() => notDefined(1)).toThrowError(
    'expected value not to be defined but got: 1',
  );
  expect(() => notDefined(1, 'DEF')).toThrowError('DEF');
});
