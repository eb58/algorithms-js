/* global  expect */
const combinations = require('../src/algorithms/combinations');

test('combinations ', () => {
  expect(combinations([1,2,3],2).length).toEqual(3);
  expect(combinations([1,2,3,4,5],2).length).toEqual(10);
  expect(combinations([1,2,3,4,5],3).length).toEqual(10);
  expect(combinations([1,2,3,4,5],4).length).toEqual(5);
});


