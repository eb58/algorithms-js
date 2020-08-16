/* global expect */

const range = require('../src/algorithms/ol').ol.range;
const qsorts = require('../src/algorithms/qsort');
const mergesort = require('../src/algorithms/mergesort');

const cmp = (s1, s2) => (s1 === s2) ? 0 : (s1 < s2 ? -1 : +1);

const sorts = [...qsorts, mergesort];

sorts.forEach(sort =>
  test('test-set1 sort numbers ' + sort.name, () => {
    const arr1 = [99, 44, 55, 23, 11, 44, 66, 88, 45, 87, 10, 20, 30, 90, 70, 40, 55, 23, 11, 4];
    const arr2 = range(100000).map(n => (Math.floor(Math.random() * 1000)));
    expect(sort([], cmp)).toMatchObject([]);
    expect(sort([1], cmp)).toMatchObject([1]);
    expect(sort([0, 0], cmp)).toMatchObject([0, 0]);
    expect(sort([1, 2], cmp)).toMatchObject([1, 2]);
    expect(sort([2, 1], cmp)).toMatchObject([1, 2]);
    expect(sort([2, 3, 1], cmp)).toMatchObject([1, 2, 3]);
    expect(sort([1, 2, 3], cmp)).toMatchObject([1, 2, 3]);
    expect(sort([1, 1, 1, 1, 1, 1], cmp)).toMatchObject([1, 1, 1, 1, 1, 1]);
    expect(sort(arr1, cmp)).toMatchObject(arr1.sort(cmp));
    expect(sort(arr2, cmp)).toMatchObject(arr2.sort(cmp));
  })
);

sorts.forEach(sort =>
  test('test-set2 quicksort objects ' + sort.name, () => {
    const cmp = (o1, o2) => o1.a === o2.a ? 0 : o1.a < o2.a ? -1 : +1;
    const arr = [{a: 99}, {a: 88}, {a: 10}, {a: 111}, {a: 37}];
    expect(sort(arr, cmp)).toMatchObject([{a: 10}, {a: 37}, {a: 88}, {a: 99}, {a: 111}]);
  })
);

sorts.forEach(sort =>
  test('test-set3 quicksort strings ' + sort.name, () => {
    const arr = ['b', 'a'];
    expect(sort(arr, cmp)).toMatchObject(['a', 'b']);
    expect(sort('das ist ein test'.split(''), cmp).join('')).toBe('   adeeiinsssttt');
  })
);