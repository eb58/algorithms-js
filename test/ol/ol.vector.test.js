const { vadd, vsqrdist, vdist, vnorm } = require('../../src/ol').vector;

test('vector functions', () => {
  expect(vadd([1, 3], [1, 7])).toEqual([2, 10]);
});

test('vector distance and norm', () => {
  expect(vsqrdist([0, 0], [3, 4])).toBe(25);
  expect(vsqrdist([1, 1], [1, 1])).toBe(0);
  expect(vdist([0, 0], [3, 4])).toBe(5);
  expect(vdist([1, 2, 3], [1, 2, 3])).toBe(0);
  expect(vnorm([3, 4])).toBe(5);
});