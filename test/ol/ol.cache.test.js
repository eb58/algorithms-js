const { cache } = require('../../src/ol');

test('cache add + get + validity', () => {
  const clock = { now: 1_000 };
  const spy = jest.spyOn(Date, 'now').mockImplementation(() => clock.now);
  const c = cache(1); // 1 sec

  c.add('a', 111);
  expect(c.get('a')).toBe(111);
  clock.now = 1_999;
  expect(c.get('a')).toBe(111);
  clock.now = 2_001;
  expect(c.get('a')).toBe(undefined);

  spy.mockRestore();
});

test('cache cleaner', () => {
  const clock = { now: 1_000 };
  const spy = jest.spyOn(Date, 'now').mockImplementation(() => clock.now);
  const c = cache(1); // 1 sec

  c.add('a', 'test');
  expect(c.get('a')).toBe('test');
  expect(Object.keys(c.cleaner()).length).toBe(1);
  clock.now = 2_001;
  expect(Object.keys(c.cleaner()).length).toBe(0);

  spy.mockRestore();
});


