const { vadd } = require('../../src/ol').vector;

test('vector functions', () => {
  expect(vadd([1, 3], [1, 7])).toEqual([2, 10]);
});
