import single from './single'

test('empty', () => {
  expect(() => single([])).toThrowError('got 0')
})

test('single', () => {
  expect(single([1])).toEqual(1)
})

test('multiple', () => {
  expect(() => single([1, 2])).toThrowError('got 2')
})
