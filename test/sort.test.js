const { range, cmp, comparerByKey } = require('../src/ol').ol;
const qsorts = require('../src/sorting/qsort');
const mergesort = require('../src/sorting/mergesort');

const sorts = [...qsorts, mergesort];

sorts.forEach((sort) =>
  test('test-set1 sort numbers ' + sort.name, () => {
    const arr1 = [99, 44, 55, 23, 11, 44, 66, 88, 45, 87, 10, 20, 30, 90, 70, 40, 55, 23, 11, 4];
    const arr2 = range(10000).map((n) => Math.floor(Math.random() * 1000));
    expect(sort([], cmp)).toEqual([]);
    expect(sort([1], cmp)).toEqual([1]);
    expect(sort([0, 0], cmp)).toEqual([0, 0]);
    expect(sort([1, 2], cmp)).toEqual([1, 2]);
    expect(sort([2, 1], cmp)).toEqual([1, 2]);
    expect(sort([2, 3, 1], cmp)).toEqual([1, 2, 3]);
    expect(sort([1, 2, 3], cmp)).toEqual([1, 2, 3]);
    expect(sort([1, 1, 1, 1, 1, 1], cmp)).toEqual([1, 1, 1, 1, 1, 1]);
    expect(sort(arr1, cmp)).toEqual(arr1.toSorted(cmp));
    expect(sort(arr2, cmp)).toEqual(arr2.toSorted(cmp));
  })
);

sorts.forEach((sort) =>
  test('test-set2 quicksort objects ' + sort.name, () => {
    const cmp = comparerByKey('a');
    const arr = [{ a: 99 }, { a: 88 }, { a: 10 }, { a: 111 }, { a: 37 }];
    expect(sort(arr, cmp)).toEqual([{ a: 10 }, { a: 37 }, { a: 88 }, { a: 99 }, { a: 111 }]);
  })
);

sorts.forEach((sort) =>
  test('test-set3 quicksort strings ' + sort.name, () => {
    const arr = ['b', 'a'];
    expect(sort(arr, cmp)).toEqual(['a', 'b']);
    expect(sort('das ist ein test'.split(''), cmp).join('')).toBe('   adeeiinsssttt');
  })
);
