const { cmp, cmpNumbers, comparer, comparerByKey } = require('../../src/ol').ol;

test('cmp', () => {
  expect(cmp(1, 1)).toBe(0);
  expect(cmp(1, 2)).toBe(-1);
  expect(cmp(2, 1)).toBe(+1);
  expect(cmp('a', 'a')).toBe(0);
  expect(cmp('a', 'b')).toBe(-1);
  expect(cmp('b', 'a')).toBe(+1);
});

test('cmpNumbers', () => {
  expect(cmpNumbers(1, 1)).toBe(0);
  expect(cmpNumbers(1, 2)).toBe(-1);
  expect(cmpNumbers(2, 1)).toBe(+1);
});

test('comparer', () => {
  const cmpByTitle = comparer(o => o.title);

  const books = [
    { title: 'Faust', author: 'Goethe' },
    { title: 'Die Räuber', author: 'Schiller' },
    { title: 'Wallenstein', author: 'Schiller' }
  ];

  expect(books.toSorted(cmpByTitle)).toEqual([
    { title: 'Die Räuber', author: 'Schiller' },
    { title: 'Faust', author: 'Goethe' },
    { title: 'Wallenstein', author: 'Schiller' }
  ]);

  expect(books.toSorted(comparerByKey('author'))).toEqual([
    { title: 'Faust', author: 'Goethe' },
    { title: 'Die Räuber', author: 'Schiller' },
    { title: 'Wallenstein', author: 'Schiller' }
  ]);

});