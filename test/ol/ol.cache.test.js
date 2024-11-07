const { cache } = require('../../src/ol');

test('cache add + get + validity', () => {
  const c = cache(1); // 1 sec
  c.add('a', 111);
  expect(c.get('a')).toBe(111);
  setTimeout(() => expect(c.get('a')).toBe(111), 1).unref();
  setTimeout(() => expect(c.get('a')).toBe(undefined), 1000).unref();
});

test('cache cleaner', () => {
  const c = cache(1); // 1 sec
  c.add('a', 'test');
  expect(c.get('a')).toBe('test');
  setTimeout(() => expect(Object.keys(c.cleaner()).length).toBe(1), 500).unref();
  setTimeout(() => expect(Object.keys(c.cleaner()).length).toBe(0), 3000).unref();
});


